package com.metabuild.infra.archunit;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.core.importer.Location;

/**
 * ArchUnit ImportOption：排除 jOOQ 生成代码，避免误报。
 */
public class DoNotIncludeGeneratedJooq implements ImportOption {

    @Override
    public boolean includes(Location location) {
        return !location.contains("/jooq-generated/")
            && !location.contains("/com/metabuild/schema/");
    }
}
