package com.medcare.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> content;
    private int pageNo;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;

    // ---------- Factory method ----------

    public static <T> PageResponse<T> of(List<T> content, int pageNo, int pageSize,
                                          long totalElements, int totalPages) {
        return PageResponse.<T>builder()
                .content(content)
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(pageNo >= totalPages - 1)
                .build();
    }
}
