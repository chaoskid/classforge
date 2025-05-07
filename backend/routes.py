from flask import Blueprint, request, jsonify, session
from database.db import SessionLocal
from database.models import Students, Clubs, Users, Teachers, SurveyResponse, Relationships, Allocations, Affiliations, Unit, CalculatedScores
import pandas as pd
import math
import numpy as np
import torch
from torch_geometric.data import Data
from utils import normalizeResponse, calculateFeatures, saveFeaturesToDb, responseToDict, saveRelationshipsToDb, saveSurveyAnswers, saveAffiliationsToDb
from auth import student_login_required, teacher_login_required, either_login_required
from werkzeug.security import check_password_hash
from survey_questions import SURVEY_QUESTION_MAP
from model_utils import generate_dataframes, map_link_types, map_student_ids, create_data_object, save_allocation_summary, save_allocations
from model.dqn.allocation_env import precompute_link_matrices
from model.dqn.train_predict import train_and_allocate, returnEnvAndAgent, allocate_with_existing_model

survey_routes = Blueprint('survey_routes', __name__)

@student_login_required
@survey_routes.route('/api/survey', methods=['POST'])
def submit_survey():
    data = request.get_json()
    db = SessionLocal()
    try:
        # saving survey response to database
        response = saveSurveyAnswers(data, db)

        #saving relationships to database
        saveRelationshipsToDb(data, db)

        # saving affiliations to database
        saveAffiliationsToDb(db,data)

        # calculating the features
        # converting response to dictionary
        survey_response_mapped = responseToDict(response)

        # converting the dictionary to a DataFrame
        survey_responsedf = pd.DataFrame(survey_response_mapped, index=[0])
        
        # normalizing the response
        normalized = normalizeResponse(survey_responsedf)

        # calculating the features
        features = calculateFeatures(normalized)

        # saving features to database in calculated_scores table
        saveFeaturesToDb(db, features) 
        
        return jsonify({"message": "Survey response saved successfully"}), 201
    except Exception as e:
        print(e)
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@either_login_required
@survey_routes.route('/api/students', methods=['GET'])
def get_students():
    db = SessionLocal()
    try:
        students = db.query(Students).all()
        result = [{
            'student_id': s.student_id,
            'first_name': s.first_name,
            'last_name': s.last_name
        } for s in students]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@either_login_required
@survey_routes.route('/api/clubs', methods=['GET'])
def get_clubs():
    db = SessionLocal()
    try:
        # Fetch all clubs
        clubs = db.query(Clubs).all()

        # Count students per club from Affiliations
        counts = (
            db.query(Affiliations.club_id, func.count(Affiliations.student_id))
            .group_by(Affiliations.club_id)
            .all()
        )
        club_count_map = {club_id: count for club_id, count in counts}

        result = [{
            'club_id': c.club_id,
            'club_name': c.club_name,
            'student_count': club_count_map.get(c.club_id, 0)
        } for c in clubs]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        db.close()


@survey_routes.route('/api/login', methods=['OPTIONS','POST'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight response'}), 200
    else:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        db = SessionLocal()
        try:
            user = db.query(Users).filter_by(user_email=email).first()
            
            if user and check_password_hash(user.password, password):
                if user.user_type == 'student':
                    student = db.query(Students).filter_by(email=email).first()
                    if student:
                        user_id = student.student_id
                if user.user_type == 'teacher':
                    teacher = db.query(Teachers).filter_by(email=email).first()
                    if teacher:
                        user_id = teacher.emp_id
                session['user_email'] = user.user_email
                session['user_type'] = user.user_type
                session['user_id'] = user_id
                print("-------------------------- LOGGED IN WITH ID: {}".format(session['user_id']))
                print("-------------------------- SESSION AFTER LOG IN: {} ".format(session))
                return jsonify({'message': 'Login successful', 'user_type': user.user_type}), 200
            return jsonify({'message': 'Invalid email or password'}), 401
        except Exception as e:
            print(e)
            return jsonify({'error': str(e)}), 500
        finally:
            db.close()
@either_login_required
@survey_routes.route('/api/logout', methods=['POST'])
def logout():
    print("-------------------------- LOGGING OUT ID: {}".format(session['user_id']))
    session.clear()
    print("-------------------------- SESSION AFTER LOG IN: {}".format(session))
    return jsonify({'message': 'Logged out'}), 200

@either_login_required
@survey_routes.route('/api/current_user', methods=['GET'])
def get_current_user():
    
    print("-------------------------- CURRENT USER : {}".format(session))
    if 'user_id' in session:
        return jsonify({'user_id': session['user_id'], 'user_type': session['user_type']}), 200
    return jsonify({'message': 'Not logged in'}), 401

@either_login_required
@survey_routes.route('/api/student-survey-responses', methods=['GET'])
def get_student_survey_responses():
    db = SessionLocal()
    try:
        user_id = session.get('user_id')

        response = db.query(SurveyResponse).filter_by(student_id=user_id).first()
        if not response:
            return jsonify({"message": "Survey not completed yet"}), 204
        
        result = {}
        for field, question in SURVEY_QUESTION_MAP.items():
            result[question] = getattr(response, field)

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@either_login_required
@survey_routes.route('/api/student-info', methods=['GET'])
def get_student_info():
    db = SessionLocal()
    try:
        student_id = session.get('user_id')
        student = db.query(Students).filter_by(student_id=student_id).first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        # Clubs
        club_ids = db.query(Affiliations.club_id).filter_by(student_id=student_id).all()
        club_ids = [cid[0] for cid in club_ids]
        club_names = db.query(Clubs.club_name).filter(Clubs.club_id.in_(club_ids)).all()
        club_names = [c[0] for c in club_names]

        # Units
        unit_ids = db.query(Allocations.unit_id).filter_by(student_id=student_id).all()
        unit_ids = [uid[0] for uid in unit_ids]
        unit_names = db.query(Unit.unit_name).filter(Unit.unit_id.in_(unit_ids)).all()
        unit_names = [u[0] for u in unit_names]
        print(unit_names)
        scores = db.query(CalculatedScores).filter_by(student_id=student_id).first()
        if scores:
            student_scores= {
                "academic_engagement_score": scores.academic_engagement_score,
                "academic_wellbeing_score": scores.academic_wellbeing_score,
                "mental_health_score": scores.mental_health_score,
                "growth_mindset_score": scores.growth_mindset_score,
                "gender_norm_score": scores.gender_norm_score,
                "social_attitude_score": scores.social_attitude_score,
                "school_environment_score": scores.school_environment_score,
            }
        else:
            student_scores={}

        # Class allocation
        allocation = db.query(Allocations).filter_by(student_id=student_id).first()
        class_id = allocation.class_id if allocation else None
        class_avg_score = None
        if class_id is not None:
            class_avg_score = db.query(func.avg(Students.academic_score))\
                        .join(Allocations, Students.student_id == Allocations.student_id)\
                        .filter(Allocations.class_id == class_id)\
                        .scalar()

        classmate_ids = []
        if class_id is not None:
            classmate_rows = db.query(Allocations.student_id).filter_by(class_id=class_id).all()
            classmate_ids = [r[0] for r in classmate_rows if r[0] != student_id]
        # Relationships with name and email
        relationships = db.query(Relationships).filter_by(source=student_id).all()
        detailed_relationships = []
        for r in relationships:
            target_student = db.query(Students).filter_by(student_id=r.target).first()
            if target_student:
                detailed_relationships.append({
                    "target_name": f"{target_student.first_name} {target_student.last_name}",
                    "target_email": target_student.email,
                    "target": target_student.student_id,  # ✅ Required for matching
                    "link_type": r.link_type
                })

        result = {
            "student": {
                "name": f"{student.first_name} {student.last_name}",
                "email": student.email,
                "house": student.house,
                "class_id": class_id,
                "scores":student_scores,
                "academic_score": student.academic_score,
                "class_average_score": class_avg_score


            },
            "clubs": club_names or ["No clubs joined"],
            "units": unit_names or ["No units enrolled"],
            "relationships": detailed_relationships,
            "classmates": classmate_ids
        }

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@either_login_required
@survey_routes.route('/api/stage_allocation', methods=['GET', 'POST'])
def stage_allocation():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight response'}), 200
    elif request.method == 'GET':
        db = SessionLocal()
        try:
            user_id = session.get('user_id')
            print("\n---------------User ID: ", user_id)
            teacher = db.query(Teachers).filter_by(emp_id=user_id).first()
            if not teacher:
                return jsonify({"message": "Invalid teacher account"}), 401
            unit_id = teacher.manage_unit
            student_id_rows = db.query(Allocations.student_id).filter_by(unit_id=unit_id, reallocation=0).all()
            student_ids = [row[0] for row in student_id_rows]
            if not student_ids:
                return jsonify({"message": "No students allocated to this unit"}), 401
            number_of_students = len(student_ids)
            return jsonify(unit_id = unit_id, number_of_unallocated_students=number_of_students), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()
    else: 
        return jsonify({'message': 'POST SUCCESSFULLLL'}), 200


@either_login_required
@survey_routes.route('/api/allocate', methods=['GET', 'POST'])
def allocate():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight response'}), 200
    elif request.method == 'GET':
        db = SessionLocal()
        try:
            user_id = session.get('user_id')
            unit_id, scores_df, relationships_df = generate_dataframes(db, user_id)
            relationships_df = map_link_types(relationships_df)
            scores_df, edges_df, id_map = map_student_ids(scores_df, relationships_df)
            data = create_data_object(scores_df, edges_df)
            print("\n------------ Data object created: \n", data)
            print("\n------------ Checking for nulls in scores_df: ")
            print(scores_df.isna().sum())

            target_class_size = 25
            student_data = data.x.cpu().numpy()
            E= precompute_link_matrices(data)
            num_students = student_data.shape[0]
            num_classes = math.ceil(num_students / target_class_size)
            feature_dim = student_data.shape[1]

            np.random.seed(999)
            target_feature_avgs = np.random.uniform(0.5, 0.9, size=(num_classes, feature_dim))
            target_feature_avgs = np.round(target_feature_avgs, 2)
            print("\n------------ Targets for each class:")
            print(target_feature_avgs)
            print("\n------------ Student data shape :", student_data.shape)
            print("\n------------ Student data :\n", student_data)
            print("\n------------ target class size : ", target_class_size)
            print("\n------------ Number of classes : ", num_classes)
            print("\n------------ shape of existing links matrix : ", E.shape)
            print("\n------------ Existing links matrix : \n", E)
            print("\n------------ num students total : ", num_students)
            print("\n------------ feature dim : ", feature_dim)

            #Call the function to train and allocate
            #allocation_summary = train_and_allocate(unit_id,num_classes,
            #                    target_class_size,
            #                    target_feature_avgs,
            #                    student_data, E,250)
            
            env, agent = returnEnvAndAgent(student_data, num_classes, target_class_size, target_feature_avgs, E,
                      model_path='model/dqn/d7.pth')
        
            allocation_summary = allocate_with_existing_model(student_data, env, agent, unit_id,E)
        
            save_allocation_summary(unit_id, allocation_summary, db)
            upserted = save_allocations(db, env, id_map, unit_id)

            return jsonify({'message':'Allocated {} students into {} classes and updated {} records in database'.format(num_students,num_classes,upserted),
                            'allocation_summary': allocation_summary}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()
    else:
        return jsonify({'message': 'GET SUCCESSFULLLL'}), 200

@survey_routes.route('/api/allocation-summary', methods=['GET'])
@either_login_required
def get_allocation_summary():
    db = SessionLocal()
    try:
        # 1. fetch all the base summary rows
        summaries = db.query(AllocationsSummary).all()
        data = []

        # 2. the relationship types you track (already plural)
        rel_types = [
            'friends',
            'advice',
            'feedback',
            'disrespect',
            'influence',
            'more_time'
        ]

        for s in summaries:
            base = s.to_dict()

            # 3. get all student_ids in this unit/class
            student_ids = [
                sid for (sid,) in db
                    .query(Allocations.student_id)
                    .filter(
                        Allocations.unit_id  == s.unit_id,
                        Allocations.class_id == s.class_id
                    )
                    .all()
            ]

            # 4. init counts to zero, mapping 'friends' → 'friendships'
            total_counts = {}
            alloc_counts = {}
            for lt in rel_types:
                if lt == 'friends':
                    total_counts['total_friendships'] = 0
                    alloc_counts['num_friendships']     = 0
                else:
                    total_counts[f'total_{lt}'] = 0
                    alloc_counts[f'num_{lt}']   = 0

            if student_ids:
                # 5. total outgoing per link_type
                total_q = (
                    db
                    .query(Relationships.link_type, func.count().label("cnt"))
                    .filter(Relationships.source.in_(student_ids))
                    .group_by(Relationships.link_type)
                    .all()
                )
                for lt, cnt in total_q:
                    if lt == 'friends':
                        total_counts['total_friendships'] = cnt
                    else:
                        total_counts[f'total_{lt}'] = cnt

                # 6. allocated (both ends in same class) per link_type
                alloc_q = (
                    db
                    .query(Relationships.link_type, func.count().label("cnt"))
                    .filter(
                        Relationships.source.in_(student_ids),
                        Relationships.target.in_(student_ids)
                    )
                    .group_by(Relationships.link_type)
                    .all()
                )
                for lt, cnt in alloc_q:
                    if lt == 'friends':
                        alloc_counts['num_friendships'] = cnt
                    else:
                        alloc_counts[f'num_{lt}'] = cnt

            # 7. merge into the response
            base.update(total_counts)
            base.update(alloc_counts)
            data.append(base)

        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        db.close()

@survey_routes.route('/api/allocation-summary/<int:class_id>', methods=['GET'])
@either_login_required
def get_class_summary(class_id):
    db = SessionLocal()
    try:
        r = db.query(AllocationsSummary).filter_by(class_id=class_id).first()
        if not r:
            return jsonify({"message": "Class not found"}), 404
        return jsonify(r.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@survey_routes.route('/api/class-relationships', methods=['GET'])
@either_login_required
def get_class_relationships():
    class_id = request.args.get('class_id', type=int)
    rel_type = request.args.get('relationship', default=None, type=str)
    db = SessionLocal()
    try:
        # 1) Get all student IDs in this class
        student_rows = db.query(Allocations.student_id) \
                         .filter_by(class_id=class_id) \
                         .all()
        student_ids = [row[0] for row in student_rows]

        # 2) Query only those relationships that connect two students in this class
        q = db.query(Relationships) \
              .filter(Relationships.source.in_(student_ids),
                      Relationships.target.in_(student_ids))
        if rel_type:
            q = q.filter_by(link_type=rel_type)
        rels = q.all()

        # 3) Build the nodes and links lists
        nodes = [
            {
                "id": f"S-{sid}",
                "class_label": f"class_{class_id}"
            }
            for sid in student_ids
        ]
        links = [
            {
                "source": f"S-{r.source}",
                "target": f"S-{r.target}",
                "link_type": r.link_type
            }
            for r in rels
        ]

        return jsonify({ "nodes": nodes, "links": links }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        db.close()
    

@teacher_login_required
@survey_routes.route('/api/students-and-classes', methods=['GET'])
def get_students_and_other_classes():
    """
    Returns:
      - students: list of { student_id, name }
      - classes:  list of { class_id, class_label } excluding the student's current class
    """
    db = SessionLocal()
    try:
        # 1) Determine current student and their allocation
        student_id = session.get('user_id')
        alloc = db.query(Allocations).filter_by(student_id=student_id).first()
        current_class = alloc.class_id if alloc else None
        unit_id = alloc.unit_id if alloc else None

        # 2) Fetch all students
        students = db.query(
            Students.student_id,
            Students.first_name,
            Students.last_name
        ).all()
        students_list = [
            {"student_id": sid, "name": f"{fn} {ln}"}
            for sid, fn, ln in students
        ]

        # 3) Fetch all classes in the same unit (or globally if no unit)
        q = db.query(
            AllocationsSummary.class_id,
            AllocationsSummary.class_label
        )
        if unit_id is not None:
            q = q.filter_by(unit_id=unit_id)
        classes = q.all()

        # 4) Exclude the current class
        classes_list = [
            {"class_id": cid, "class_label": label}
            for cid, label in classes
            if cid != current_class
        ]

        return jsonify({
            "students": students_list,
            "classes":  classes_list
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@teacher_login_required
@survey_routes.route('/api/simulate-allocation', methods=['POST'])
def simulate_allocation():
    data = request.get_json() or {}
    student_id = data.get('student_id')
    target_class = data.get('class_id')

    if student_id is None or target_class is None:
        return jsonify({"error": "Both student_id and class_id are required"}), 400

    db = SessionLocal()
    try:
        # — Features/Averages Simulation (same as before) —
        student = db.query(CalculatedScores).filter_by(student_id=student_id).first()
        if not student:
            return jsonify({"error": f"Student {student_id} not found"}), 404

        summary = db.query(AllocationsSummary).filter_by(class_id=target_class).first()
        if not summary:
            return jsonify({"error": f"Class {target_class} not found"}), 404

        base_fields   = [
            'academic_engagement_score',
            'academic_wellbeing_score',
            'mental_health_score',
            'growth_mindset_score',
            'gender_norm_score',
            'social_attitude_score',
            'school_environment_score'
        ]
        current_count = summary.student_count or 0

        original_avgs = {}
        new_avgs      = {}
        for field in base_fields:
            alloc_col   = f"alloc_{field}"
            class_avg   = float(getattr(summary, alloc_col))
            student_val = float(getattr(student, field))
            new_avg     = (class_avg * current_count + student_val) / (current_count + 1)
            original_avgs[field] = class_avg
            new_avgs[field]      = new_avg

        # — Relationship summary (same as before) —
        alloc_rec     = db.query(Allocations).filter_by(student_id=student_id).first()
        current_class = alloc_rec.class_id if alloc_rec else None

        rel_rows      = db.query(Relationships).filter_by(source=student_id).all()
        rel_types     = ['friends','influential','feedback','more_time','advice','disrespect']
        relationship_summary = {}

        for rel_type in rel_types:
            targets    = [r.target for r in rel_rows if r.link_type == rel_type]
            total_ct   = len(targets)
            curr_ct    = db.query(Allocations).filter(
                            Allocations.student_id.in_(targets),
                            Allocations.class_id == current_class
                        ).count() if current_class else 0
            new_ct     = db.query(Allocations).filter(
                            Allocations.student_id.in_(targets),
                            Allocations.class_id == target_class
                        ).count() if targets else 0

            relationship_summary[rel_type] = {
                "total":         total_ct,
                "current_class": curr_ct,
                "target_class":  new_ct,
                "difference":    new_ct - curr_ct
            }

        # — Build graph data for frontend —
        # 1) All members of the target class
        member_ids = [row[0] for row in db.query(Allocations.student_id)
                                     .filter_by(class_id=target_class).all()]
        students   = db.query(Students).filter(Students.student_id.in_(member_ids)).all()
        nodes = [
            {"id": s.student_id, "label": f"{s.first_name} {s.last_name}"}
            for s in students
        ]

        # 2) Only this student's reported links within that class
        links = [
            {"source": student_id, "target": r.target, "link_type": r.link_type}
            for r in rel_rows
            if r.target in member_ids
        ]

        # — Final Response —
        return jsonify({
            "student_id":            student_id,
            "class_id":              target_class,
            "original_count":        current_count,
            "new_count":             current_count + 1,
            "original_averages":     original_avgs,
            "new_averages":          new_avgs,
            "relationship_summary":  relationship_summary,
            "nodes":                 nodes,
            "links":                 links
        }), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

