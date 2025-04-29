from flask import Blueprint, request, jsonify, session
from database.db import SessionLocal
from database.models import Students, Clubs, Users, Teachers, SurveyResponse, Relationships, Allocations, Affiliations, Unit, CalculatedScores, AllocationsSummary
import pandas as pd
import math
import numpy as np
import torch
from torch_geometric.data import Data
from utils import normalizeResponse, calculateFeatures, saveFeaturesToDb, responseToDict, saveRelationshipsToDb, saveSurveyAnswers, saveAffiliationsToDb
from auth import student_login_required, teacher_login_required, either_login_required
from werkzeug.security import check_password_hash
from sqlalchemy import func
from survey_questions import SURVEY_QUESTION_MAP
from model_utils import generate_dataframes, map_link_types, map_student_ids, create_data_object, save_allocation_summary, save_allocations, generate_target_matrix
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
        clubs = db.query(Clubs).all()
        result = [{
            'club_id': c.club_id,
            'club_name': c.club_name
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

        # Relationships with name and email
        relationships = db.query(Relationships).filter_by(source=student_id).all()
        detailed_relationships = []
        for r in relationships:
            target_student = db.query(Students).filter_by(student_id=r.target).first()
            if target_student:
                detailed_relationships.append({
                    "target_name": f"{target_student.first_name} {target_student.last_name}",
                    "target_email": target_student.email,
                    "link_type": r.link_type
                })

        result = {
            "student": {
                "name": f"{student.first_name} {student.last_name}",
                "email": student.email,
                "house": student.house
            },
            "clubs": club_names or ["No clubs joined"],
            "units": unit_names or ["No units enrolled"],
            "relationships": detailed_relationships
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
            
            # Calculate the global averages for each score
            avg_academic_engagement = db.query(func.avg(CalculatedScores.academic_engagement_score)).scalar()
            avg_academic_wellbeing = db.query(func.avg(CalculatedScores.academic_wellbeing_score)).scalar()
            avg_mental_health = db.query(func.avg(CalculatedScores.mental_health_score)).scalar()
            avg_growth_mindset = db.query(func.avg(CalculatedScores.growth_mindset_score)).scalar()
            avg_gender_norm = db.query(func.avg(CalculatedScores.gender_norm_score)).scalar()
            avg_social_attitude = db.query(func.avg(CalculatedScores.social_attitude_score)).scalar()
            avg_school_environment = db.query(func.avg(CalculatedScores.school_environment_score)).scalar()

            # Send the values to the frontend
            return jsonify({
                "unit_id": unit_id,
                "number_of_unallocated_students": number_of_students,
                "global_averages": {
                    "academic_engagement_score": avg_academic_engagement,
                    "academic_wellbeing_score": avg_academic_wellbeing,
                    "mental_health_score": avg_mental_health,
                    "growth_mindset_score": avg_growth_mindset,
                    "gender_norm_score": avg_gender_norm,
                    "social_attitude_score": avg_social_attitude,
                    "school_environment_score": avg_school_environment
                }
            }), 200
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
    elif request.method == 'POST':
        data = request.get_json()
        model = data.get('model_path')
        num_classes = data.get('num_classes')

        if model not in ['dq5.pth', 'dq7.pth', 'dq9.pth']:
            return jsonify({"error": "Invalid model path"}), 400
        if num_classes not in [5, 7, 9]:
            return jsonify({"error": "Invalid number of classes"}), 400
        target_feature_avgs = generate_target_matrix(data.get('target_values'))
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

            #num_classes = 7
            student_data = data.x.cpu().numpy()
            E= precompute_link_matrices(data)
            num_students = student_data.shape[0]
            target_class_size = math.ceil(num_students / num_classes)
            feature_dim = student_data.shape[1]

            #np.random.seed(8)
            #target_feature_avgs = np.random.uniform(0.5, 0.9, size=(num_classes, feature_dim))
            #target_feature_avgs = np.round(target_feature_avgs, 2)
            
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
            model_path = "model/dqn/d{}.pth".format(num_classes)
            print('"\n------------ using model: {}'.format(model_path))
            env, agent = returnEnvAndAgent(student_data, num_classes, target_class_size, target_feature_avgs, E,
                      model_path)
        
            allocation_summary = allocate_with_existing_model(student_data, env, agent, unit_id,E)
        
            save_allocation_summary(unit_id, allocation_summary, db)
            upserted = save_allocations(db, env, id_map, unit_id)

            return jsonify({'message':'Allocated {} students into {} classes and updated {} records in database'.format(num_students,num_classes,upserted),
                            'allocation_summary': allocation_summary}), 200
        except Exception as e:
            print(e)
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
        rows = db.query(AllocationsSummary).all()
        data = [r.to_dict() for r in rows]
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