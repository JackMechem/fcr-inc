package com.inc.fcr.utils;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;

public class EntityController {

    // Helper function used by entity classes
    public static void copyFields(Object src, Object dest) throws IllegalAccessException {
        for (Field field : src.getClass().getDeclaredFields()) {
            int modifiers = field.getModifiers(); // ignore static vars
            if (Modifier.isStatic(modifiers) /*|| Modifier.isFinal(modifiers)*/) continue;

            field.setAccessible(true); // override access modifier
            field.set(dest, field.get(src));
        }
    }
}
