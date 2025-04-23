# seed_users.py
from database.db import SessionLocal
from database.models import Users, Students
from werkzeug.security import generate_password_hash

def create_student_users():
    db = SessionLocal()
    try:
        students = db.query(Students).all()
        users = []
        for student in students:
            user = Users(
                user_email=student.email,
                password=generate_password_hash((student.first_name+student.last_name).lower()),
                user_type='student'
            )
            users.append(user)
    
        db.add_all(users)
        db.commit()
        print("All students loaded to users table successfully.")
    
    except Exception as e:
        db.rollback()
        print("Error:", e)
    finally:
        db.close()

if __name__ == '__main__':
    create_student_users()
