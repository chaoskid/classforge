from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Numeric
from sqlalchemy.sql import func
from .db import Base

class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    student_id = Column(Integer, ForeignKey("students.student_id"),primary_key=True)
    home_lang_ans = Column(String)

    # School experience questions
    comfortability_ans = Column(Integer)
    isolated_school_ans = Column(Integer)
    criticise_school_ans = Column(Integer)
    opinion_school_ans = Column(Integer)
    bullying_ans = Column(Integer)
    future_ans = Column(Integer)
    covid_ans = Column(Integer)    

    # wellbeing questions
    how_happy_ans = Column(Integer)
    nervous_ans = Column(Integer)
    hopeless_ans = Column(Integer)
    restless_ans = Column(Integer)
    depressed_ans = Column(Integer)
    effort_ans = Column(Integer)
    worthless_ans = Column(Integer)
    
    # growth mindset questions
    intelligence1_ans = Column(Integer)
    intelligence2_ans = Column(Integer)

    # gender norms questions
    man_chores_opinion = Column(Integer)
    man_violence_opinion = Column(Integer)
    man_sexual_opinion = Column(Integer)
    man_fears_opinion = Column(Integer)
    gay_man_opinion = Column(Integer)
    
    # social attitude questions
    soft_sport_boys_ans = Column(Integer)
    gender_diff_ans = Column(Integer)
    nerds_ans = Column(Integer)
    men_better_stem_ans = Column(Integer)


class CalculatedScores(Base):
    __tablename__ = "calculated_scores"

    student_id = Column(Integer, ForeignKey("students.student_id"), primary_key=True)
    academic_engagement_score  = Column(Numeric(5, 3))
    academic_wellbeing_score   = Column(Numeric(5, 3))
    mental_health_score        = Column(Numeric(5, 3))
    growth_mindset_score       = Column(Numeric(5, 3))
    gender_norm_score          = Column(Numeric(5, 3))
    social_attitude_score      = Column(Numeric(5, 3))
    school_environment_score   = Column(Numeric(5, 3))

    def to_dict(self):
        """
        Convert this CalculatedScores ORM object into a dict.
        """
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}

class Users(Base):
    __tablename__ = "users"

    user_email = Column(String, primary_key=True)
    password = Column(String)
    user_type = Column(String)  

class Teachers(Base):
    __tablename__ = "teachers"

    emp_id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    manage_unit = Column(Integer, ForeignKey("unit.unit_id"))

class Students(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    house = Column(String)
    years = Column(Integer)
    academic_score = Column(Float, nullable=True)

class Relationships(Base):
    __tablename__ = "relationships"

    source = Column(Integer, primary_key=True)
    target = Column(Integer, ForeignKey("students.student_id"), primary_key=True)
    link_type = Column(String, primary_key=True)

    def to_dict(self):
        """
        Convert this CalculatedScores ORM object into a dict.
        """
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}

class Allocations(Base):
    __tablename__ = "allocations"

    unit_id = Column(Integer, ForeignKey("unit.unit_id"), primary_key=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), primary_key=True)
    class_id = Column(Integer)
    reallocation = Column(Integer, default=0)

class AllocationsSummary(Base):
    __tablename__ = "allocation_summary"

    unit_id = Column(Integer, ForeignKey("unit.unit_id"), primary_key=True)
    class_id = Column(Integer, primary_key=True)
    class_label = Column(String)
    student_count = Column(Integer)
    alloc_academic_engagement_score  = Column(Numeric(5, 3))
    alloc_academic_wellbeing_score   = Column(Numeric(5, 3))
    alloc_mental_health_score        = Column(Numeric(5, 3))
    alloc_growth_mindset_score       = Column(Numeric(5, 3))
    alloc_gender_norm_score          = Column(Numeric(5, 3))
    alloc_social_attitude_score      = Column(Numeric(5, 3))
    alloc_school_environment_score   = Column(Numeric(5, 3))
    target_academic_engagement_score  = Column(Numeric(5, 3))
    target_academic_wellbeing_score   = Column(Numeric(5, 3))
    target_mental_health_score        = Column(Numeric(5, 3))
    target_growth_mindset_score       = Column(Numeric(5, 3))
    target_gender_norm_score          = Column(Numeric(5, 3))
    target_social_attitude_score      = Column(Numeric(5, 3))
    target_school_environment_score   = Column(Numeric(5, 3))
    num_friendships = Column(Integer)
    num_influence = Column(Integer)
    num_feedback = Column(Integer)
    num_more_time = Column(Integer)
    num_advice = Column(Integer)
    num_disrespect = Column(Integer)
    def to_dict(self):
        """
        Convert this AllocationsSummary ORM object into a dict.
        """
        return {col.name: getattr(self, col.name) for col in self.__table__.columns}


class Unit(Base):
    __tablename__ = "unit"

    unit_id = Column(Integer, primary_key = True)
    unit_name = Column(String)

class Affiliations(Base):
    __tablename__ = "affiliations"

    student_id = Column(Integer, ForeignKey("students.student_id"), primary_key=True)
    club_id = Column(Integer, ForeignKey("clubs.club_id"), primary_key=True)

class Clubs(Base):
    __tablename__ = "clubs"

    club_id = Column(Integer, primary_key = True)
    club_name = Column(String)

class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.emp_id"), nullable=True)
    student_feedback = Column(Text, nullable=True)
    teacher_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
