package com.prettynails.repository;

import com.prettynails.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SettingRepository extends JpaRepository<Setting, String> {

    Optional<Setting> findByKey(String key);

    List<Setting> findByKeyIn(List<String> keys);
}