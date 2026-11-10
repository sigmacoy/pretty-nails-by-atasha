package com.cituccs.sims.Entity;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String courseName;
    private String courseCode;
    private String courseDesc;

    @OneToMany(mappedBy = "course")
    private List<Student> studentList;

    public Course(){}
    public Course(
        String courseName,
        String courseCode,
        String courseDesc
    ){
        this.courseName = courseName;
        this.courseCode = courseCode;
        this.courseDesc = courseDesc;
    }

    public int getId() {
        return id;
    }

    public void setId(
        int id
    ){
        this.id = id;
    }

    public String getCourseName() {
        return courseName;
    }

    public void setCourseName(
        String courseName
    ){
        this.courseName = courseName;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(
        String courseCode
    ){
        this.courseCode = courseCode;
    }

    public String getCourseDesc() {
        return courseDesc;
    }

    public void setCourseDesc(
        String courseDesc
    ) {
        this.courseDesc = courseDesc;
    }
}
