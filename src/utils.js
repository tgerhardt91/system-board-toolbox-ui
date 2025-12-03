export function getDisplayGrade(gradeInteger) {
    if(gradeInteger >= 1 && gradeInteger <= 12) {
        return "V0";
    } else if(gradeInteger >= 13 && gradeInteger <= 14) {
        return "V1";
    } else if(gradeInteger == 15) {
        return "V2";
    } else if(gradeInteger == 16) {
        return "V3";
    } else if(gradeInteger == 17) {
        return "V3+";
    } else if(gradeInteger == 18) {
        return "V4";
    } else if(gradeInteger == 19) {
        return "V4+";
    } else if(gradeInteger == 20) {
        return "V5";
    } else if(gradeInteger == 21) {
        return "V5+";
    } else if(gradeInteger == 22) {
        return "V6";
    } else if(gradeInteger == 23) {
        return "V7";
    } else if(gradeInteger == 24) {
        return "V8";
    } else if(gradeInteger == 25) {
        return "V8+";
    } else if(gradeInteger == 26) {
        return "V9";
    } else if(gradeInteger == 27) {
        return "V10";
    } else if(gradeInteger == 28) {
        return "V11";
    } else if(gradeInteger == 29) {
        return "V12";
    } else if(gradeInteger == 30) {
        return "V13";
    } else if(gradeInteger == 31) {
        return "V14";
    } else if(gradeInteger == 32) {
        return "V15";
    } else if(gradeInteger == 33) {
        return "V16";
    } else if(gradeInteger == 34) {
        return "V17";
    }

    return "V?";
}

export const difficultyOptions = 
     [
  "4a/V0", "4b/V0", "4c/V0",
  "5a/V1", "5b/V1", "5c/V2",
  "6a/V3", "6a+/V3", "6b/V4", "6b+/V4",
  "6c/V5", "6c+/V5",
  "7a/V6", "7a+/V7",
  "7b/V8", "7b+/V8",
  "7c/V9", "7c+/V10",
  "8a/V11", "8a+/V12",
  "8b/V13", "8b+/V14",
  "8c/V15", "8c+/V16"
];
