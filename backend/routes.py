from flask import Blueprint, request, jsonify, session
from database.db import SessionLocal
from database.models import Students, Clubs, Users, Teachers
import pandas as pd
from utils import normalizeResponse, calculateFeatures, saveFeaturesToDb, responseToDict, saveRelationshipsToDb, saveSurveyAnswers
import random
from werkzeug.security import check_password_hash

survey_routes = Blueprint('survey_routes', __name__)

@survey_routes.route('/api/survey', methods=['POST'])
def submit_survey():
    data = request.get_json()
    print("----------------------- SUBMIT API RESPONSE:")
    print(data)
    db = SessionLocal()
    try:
        response = saveSurveyAnswers(data, db)
        print("response: ",response)
        saveRelationshipsToDb(data, db)
        print("saved relationships to db")
        survey_response_mapped = responseToDict(response)

        survey_responsedf = pd.DataFrame(survey_response_mapped, index=[0])
        
        normalized = normalizeResponse(survey_responsedf)

        features = calculateFeatures(normalized)
        # Save the calculated features to the database
        saveFeaturesToDb(db, features) 
        
        return jsonify({"message": "Survey response saved successfully"}), 201
    except Exception as e:
        print(e)
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

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

@survey_routes.route('/api/network-responses', methods=['POST'])
def receive_network_responses():
    data = request.get_json()
    print("\n===== Network Submission Received =====")
    print("Social Relationships:")
    for item in data.get('responses', []):
        print(f"From: {item['source']}, To: {item['target']}, Type: {item['link_type']}")
    
    print("\nClub Affiliations:")
    print(f"Student: {data.get('clubs', {}).get('student_id')}, Clubs: {data.get('clubs', {}).get('club_ids')}")

    print("======================================\n")

    return jsonify({"message": "Data received and printed to terminal"}), 200

@survey_routes.route('/api/login', methods=['OPTIONS','POST'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight response'}), 200
    else:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        print(email)

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
                print("\n\n -------------------------- LOGGED IN WITH ID: {} --------------------------".format(session['user_id']))
                print("\n\n -------------------------- SESSION AFTER LOG IN: {} --------------------------".format(session))
                return jsonify({'message': 'Login successful', 'user_type': user.user_type}), 200
            return jsonify({'message': 'Invalid email or password'}), 401
        except Exception as e:
            print(e)
            return jsonify({'error': str(e)}), 500
        finally:
            db.close()

@survey_routes.route('/api/logout', methods=['POST'])
def logout():
    print("\n\n -------------------------- LOGGING OUT ID: {} --------------------------".format(session['user_id']))
    session.clear()
    print("\n\n -------------------------- SESSION AFTER LOG IN: {} --------------------------".format(session))
    return jsonify({'message': 'Logged out'}), 200

@survey_routes.route('/api/current_user', methods=['GET'])
def get_current_user():
    
    print("\n\n -------------------------- SESSION  STATE NOW : {} --------------------------".format(session))
    if 'user_id' in session:
        return jsonify({'user_id': session['user_id'], 'user_type': session['user_type']}), 200
    return jsonify({'message': 'Not logged in'}), 401



