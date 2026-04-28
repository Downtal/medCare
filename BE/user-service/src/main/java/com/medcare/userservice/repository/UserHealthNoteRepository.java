package com.medcare.userservice.repository;

import com.medcare.userservice.entity.UserHealthNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserHealthNoteRepository extends JpaRepository<UserHealthNote, Long> {
}
