import { Model } from "sequelize";
/*
 #
 # Copyright (c) 2018 nexB Inc. and others. All rights reserved.
 # https://nexb.com and https://github.com/nexB/scancode-workbench/
 # The ScanCode Workbench software is licensed under the Apache License version 2.0.
 # ScanCode is a trademark of nexB Inc.
 #
 # You may not use this software except in compliance with the License.
 # You may obtain a copy of the License at: http://apache.org/licenses/LICENSE-2.0
 # Unless required by applicable law or agreed to in writing, software distributed
 # under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 # CONDITIONS OF ANY KIND, either express or implied. See the License for the
 # specific language governing permissions and limitations under the License.
 #
 */

import { Sequelize, DataTypes } from "sequelize";

export interface ScanErrorAttributes {
  scan_error: string;
}

export default function scanErrorModel(sequelize: Sequelize) {
  return sequelize.define<Model<ScanErrorAttributes>>(
    "scan_errors",
    {
      scan_error: DataTypes.STRING,
    },
    {
      timestamps: false,
    }
  );
}
