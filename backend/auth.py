from functools import wraps
from flask import session, jsonify

#Custom decorator for student login
def student_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print("Student Check Decorator, Session: ", session)
        if "user_id" not in session:
            return jsonify({'type':'error',"message":"Unauthorized access, please log in"}),401
        if "user_type" not in session:
            return jsonify({'type':'error',"message":"Unauthorized access, please log in"}),401
        elif session["user_type"] != "student":
            return jsonify({'type':'error',"message":"Unauthorized access, please log in"}),401
        return f(*args, **kwargs)
    return decorated_function

def teacher_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print("Teacher Check Decorator, Session: ", session)
        if "user_id" not in session:
            return jsonify({'type':'error',"message":"Unauthorized access, please log in"}),401
        if "user_type" not in session:
            return jsonify({'type':'error',"message":"Unauthorized access, please log in"}),401
        elif session["user_type"] != "teacher":
            return jsonify({'type':'error',"message":"Unauthorized access, please log in"}),401
        return f(*args, **kwargs)
    return decorated_function

def either_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print("Teacher Check Decorator, Session: ", session)
        if "user_id" not in session:
            return jsonify({'type':'error',"message":"Unauthorized access, please log in"}),401
        return f(*args, **kwargs)
    return decorated_function