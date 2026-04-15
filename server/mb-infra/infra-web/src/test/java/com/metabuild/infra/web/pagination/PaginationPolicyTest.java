package com.metabuild.infra.web.pagination;

import com.metabuild.common.exception.BusinessException;
import com.metabuild.common.exception.CommonErrorCodes;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaginationPolicyTest {

    private final PaginationPolicy policy = new PaginationPolicy(new MbPaginationProperties(20, 200));

    @Test
    void normalize_should_apply_defaults_when_page_and_size_missing() {
        PageRequestDto request = new PageRequestDto();

        var query = policy.normalize(request);

        assertThat(query.page()).isEqualTo(1);
        assertThat(query.size()).isEqualTo(20);
        assertThat(query.sort()).isNull();
    }

    @Test
    void normalize_should_trim_blank_sort_values() {
        PageRequestDto request = new PageRequestDto();
        request.setPage(2);
        request.setSize(50);
        request.setSort(List.of("createdAt,desc", "", "username,asc"));

        var query = policy.normalize(request);

        assertThat(query.page()).isEqualTo(2);
        assertThat(query.size()).isEqualTo(50);
        assertThat(query.sort()).containsExactly("createdAt,desc", "username,asc");
    }

    @Test
    void normalize_should_throw_when_page_less_than_one() {
        PageRequestDto request = new PageRequestDto();
        request.setPage(0);

        assertThatThrownBy(() -> policy.normalize(request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining(CommonErrorCodes.PAGINATION_INVALID_PAGE);
    }

    @Test
    void normalize_should_throw_when_size_exceeds_max_size() {
        PageRequestDto request = new PageRequestDto();
        request.setSize(201);

        assertThatThrownBy(() -> policy.normalize(request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining(CommonErrorCodes.PAGINATION_INVALID_SIZE);
    }
}
