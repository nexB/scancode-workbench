import { Model } from "sequelize";
import { HeaderAttributes } from "../services/models/header";

export function parseIfValidJson(str: unknown) {
  if (typeof str !== "string") return null;
  try {
    const parsedObj = JSON.parse(str);
    // Return only if it is an object & not a primitive value
    if (Object(parsedObj) === parsedObj) return parsedObj;
    return null;
  } catch (e) {
    return null;
  }
}

export enum ScanOptionKeys {
  CLASSIFY = "--classify",
  COPYRIGHT = "--copyright",
  SYSTEM_PACKAGE = "--system-package",
  JSON_PP = "--json-pp",
  SUMMARY = "--summary",
  PROCESSES = "--processes",
  INFO = "--info",
  EMAIL = "--email",
  URL = "--url",
  PACKAGE = "--package",
  LICENSE = "--license",
  LICENSE_DIAGNOSTICS = "--license-diagnostics",
  LICENSE_REFERENCES = "--license-references",
  LICENSE_TEXT = "--license-text",
  LICENSE_SCORE = "--license-score",
  UNKNOWN_LICENSES = "--unknown-licenses",
}

export interface ScanInfo {
  tool_name: string;
  tool_version: string;
  notice: string;
  duration: number;
  optionsList: [string, unknown][];
  optionsMap: Map<string, ScanOptionKeys>;
  input: string[];
  files_count: number;
  output_format_version: string;
  spdx_license_list_version: string;
  operating_system: string;
  cpu_architecture: string;
  platform: string;
  platform_version: string;
  python_version: string;
  workbench_version: string;
  workbench_notice: string;
  raw_header_content: string;
}

export function parseScanInfo(rawInfo: Model<HeaderAttributes, HeaderAttributes>){
  const optionsList = Object.entries(
    parseIfValidJson(rawInfo.getDataValue("options")?.toString({})) ||
      []
  ) || [];
  const optionsMap = new Map<string, ScanOptionKeys>(optionsList.map(([k,v]) => [k, v as ScanOptionKeys]));

  const parsedScanInfo: ScanInfo = {
    tool_name: rawInfo.getDataValue("tool_name").toString({}) || "",
    tool_version: rawInfo.getDataValue("tool_version").toString({}) || "",
    notice: rawInfo.getDataValue("notice").toString({}) || "",
    duration: Number(rawInfo.getDataValue("duration")),
    optionsList,
    optionsMap,
    input:
      parseIfValidJson(rawInfo.getDataValue("input")?.toString({})) || [],
    files_count: Number(rawInfo.getDataValue("files_count")),
    output_format_version:
      rawInfo.getDataValue("output_format_version")?.toString({}) || "",
    spdx_license_list_version:
      rawInfo.getDataValue("spdx_license_list_version")?.toString({}) ||
      "",
    operating_system:
      rawInfo.getDataValue("operating_system")?.toString({}) || "",
    cpu_architecture:
      rawInfo.getDataValue("cpu_architecture")?.toString({}) || "",
    platform: rawInfo.getDataValue("platform")?.toString({}) || "",
    platform_version:
      rawInfo.getDataValue("platform_version")?.toString({}) || "",
    python_version:
      rawInfo.getDataValue("python_version")?.toString({}) || "",
    workbench_version:
      rawInfo.getDataValue("workbench_version")?.toString({}) || "",
    workbench_notice:
      rawInfo.getDataValue("workbench_notice")?.toString({}) || "",
    raw_header_content:
      rawInfo.getDataValue("header_content")?.toString({}) || "",
  };
  return parsedScanInfo;
}