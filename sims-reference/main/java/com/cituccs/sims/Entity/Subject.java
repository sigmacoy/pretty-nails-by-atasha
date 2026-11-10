package com.cituccs.sims.Entity;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "subjects")
public class Subject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String subjName;
    private String subjCode;
    @Column(name="subjectDescription")
    private String subjDesc;

    @ManyToMany(mappedBy = "subjects")
    private List<Student> studentList;

    public Subject(){}
    public Subject(
            String subjName,
            String subjCode,
            String subjDesc
    ){
        this.subjName = subjName;
        this.subjCode = subjCode;
        this.subjDesc = subjDesc;
    }

    public int getId() {
        return id;
    }

    public void setId(
            int id
    ){
        this.id = id;
    }

    public String getSubjName() {
        return subjName;
    }

    public void setSubjName(
            String subjName
    ){
        this.subjName = subjName;
    }

    public String getSubjCode() {
        return subjCode;
    }

    public void setSubjCode(
            String subjCode
    ) {
        this.subjCode = subjCode;
    }

    public String getSubjDesc() {
        return subjDesc;
    }

    public void setSubjDesc(
            String subjDesc
    ) {
        this.subjDesc = subjDesc;
    }
}