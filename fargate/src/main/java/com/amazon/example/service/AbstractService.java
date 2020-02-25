/*
 * Copyright 2010-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */
package com.amazon.example.service;

import com.amazon.example.pojo.User;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.HashMap;
import java.util.Map;

public abstract class AbstractService {

    public final static String USER_USERNAME_COL = "userName";
    public final static String USER_FIRSTNAME_COL = "firstName";
    public final static String USER_LASTNAME_COL = "lastName";
    public final static String USER_AGE_COL = "age";
    public final static String USER_ID_COL = "userId";

    public String getTableName() {
        return "Users";
    }

    protected ScanRequest scanRequest() {
        return ScanRequest.builder().tableName(getTableName())
                .attributesToGet(USER_ID_COL, USER_USERNAME_COL, USER_FIRSTNAME_COL, USER_LASTNAME_COL, USER_AGE_COL).build();
    }

    protected PutItemRequest putRequest(User user) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put(USER_USERNAME_COL, AttributeValue.builder().s(user.getUserName()).build());
        item.put(USER_FIRSTNAME_COL, AttributeValue.builder().s(user.getFirstName()).build());
        item.put(USER_LASTNAME_COL, AttributeValue.builder().s(user.getLastName()).build());
        item.put(USER_ID_COL, AttributeValue.builder().s(user.getUserId()).build());
        item.put(USER_AGE_COL, AttributeValue.builder().n(Integer.valueOf(user.getAge()).toString()).build());

        return PutItemRequest.builder()
                .tableName(getTableName())
                .item(item)
                .build();
    }

    protected DeleteItemRequest deleteRequest(String userId) {
        Map<String, AttributeValue> key = new HashMap<>();
        key.put(USER_ID_COL, AttributeValue.builder().s(userId).build());

        return DeleteItemRequest.builder().tableName(getTableName()).key(key).build();
    }

    protected GetItemRequest getRequest(String userId) {
        Map<String, AttributeValue> key = new HashMap<>();
        key.put(USER_ID_COL, AttributeValue.builder().s(userId).build());

        return GetItemRequest.builder()
                .tableName(getTableName())
                .key(key)
                .attributesToGet(USER_ID_COL, USER_USERNAME_COL, USER_FIRSTNAME_COL, USER_LASTNAME_COL, USER_AGE_COL)
                .build();
    }
}
