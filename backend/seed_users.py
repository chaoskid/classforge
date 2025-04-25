# seed_users.py
from database.db import SessionLocal
from database.models import Users, Students, Unit, Allocations, Teachers
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

def create_units():
    db = SessionLocal()
    unit_name = "Psychology" 
    unit_id = 7
    try:
        unit = Unit(
                unit_id=unit_id,
                unit_name=unit_name
            )
    
        db.merge(unit)
        db.commit()
        print("Unit table loaded with 1 unit.")
    
    except Exception as e:
        db.rollback()
        print("Error:", e)
    finally:
        db.close()

def load_allocations():
    db = SessionLocal()
    try:
        students = db.query(Students).all()
        for student in students:
            allocation = Allocations(
                unit_id=7,
                student_id=student.student_id,
            )
            db.add(allocation)
        db.commit()
        print("Students allocated to unit 7 successfully.")
    except Exception as e:
        db.rollback()
        print("Error:", e)
    finally:
        db.close()

def load_teachers():
    db = SessionLocal()
    emp_id = 1
    first_name = "Abram"
    last_name = "Qureshi"
    email = 'abram.qureshi@school.edu'
    manage_unit = 7
    try:
        teacher = Teachers(
            emp_id=emp_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            manage_unit=manage_unit
        )
        db.merge(teacher)
        db.commit()
        print("Teacher Abram Qureshi, for unit 7 loaded to teachers table successfully.")

        user = Users(
            user_email=email,
            password=generate_password_hash((first_name+last_name).lower()),
            user_type='teacher'
        )
        db.merge(user)
        db.commit()
        print("Teacher Abram Qureshi loaded to users table successfully.")
    except Exception as e:
        db.rollback()
        print("Error:", e)
    finally:
        db.close()


if __name__ == '__main__':
    create_student_users()
    create_units()
    load_allocations()
    load_teachers()