package com.cituccs.sims.Entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String lastname;
    private String firstname;

    @ManyToOne
    @JoinColumn(name="course_id")
    // keep relationship
    // value of course join column of
    private Course course;

    @ManyToMany // created associative table
    @JoinTable(
            name="student_subjects",
            joinColumns = @JoinColumn(name = "subject_id"),
            inverseJoinColumns = @JoinColumn(name="student_id")
    )
    private List<Subject> subjects;
    private int yearLevel;

    public Student(){}
    public Student(
            String lastname,
            String firstname,
            Course course,
            List<Subject> subjects,
            int level
    ){
        this.lastname = lastname;
        this.firstname = firstname;
        this.course = course;
        this.subjects = subjects;
        yearLevel = level;
    }

    public int getId() {
        return id;
    }

    public void setId(
        int id
    ) {
        this.id = id;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(
        String lastname
    ) {
        this.lastname = lastname;
    }

    public String getFname() {
        return firstname;
    }

    public void setFname(
        String firstname
    ) {
        this.firstname = firstname;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(
            Course course
    ) {
        this.course = course;
    }

    public List<Subject> getSubjects() {
        return subjects;
    }

    public void setSubjects(
            List<Subject> subjects
    ) {
        this.subjects = subjects;
    }

    public int getYearLevel() {
        return yearLevel;
    }

    public void setYearLevel(
            int yearLevel
    ) {
        this.yearLevel = yearLevel;
    }
}

/*

@ElementCollection
@CollectionTable(
    name = "student_subjects",
    joinColumns = @JoinColumn(name = "student_id")
)
@Column(name = "subject")
private List<String> subjects;

 */