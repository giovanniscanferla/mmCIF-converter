const fs = require('fs');

function getObject(file) {

  var str = fs.readFileSync(file, 'utf8');

  var fileArray = str.split("\n").map(str => str.trim()).filter(v => v != '').filter(v => !v.startsWith("#"));

  var semicolon = false;
  var sentence = "";

  for (let index = 0; index < fileArray.length; index++) {

    if (fileArray[index].startsWith(";") && semicolon === false) {
      semicolon = true;
      fileArray[index] = fileArray[index].substring(1, fileArray[index].length);
      sentence = sentence + fileArray[index];
      fileArray[index] = "";
    } else if (fileArray[index].startsWith(";") && semicolon === true) {
      semicolon = false;
      fileArray[index] = sentence;
      sentence = "";
    } else if (semicolon === true) {
      sentence = sentence + fileArray[index];
      fileArray[index] = "";
    }

  }

  fileArray = fileArray.filter(v => v != '');

  var fileObj = {};

  var datablockObj = {};
  var firstBlock = true;

  var isLoop = false;
  var dataname = "";
  var precArray = new Array();

  fileArray.forEach(line => {

    line = line.trim();

    //IF THERE ARE MULTIPLE DATABLOCKS
    if (line.startsWith("data_") && firstBlock) {
      datablockObj["datablock"] = line.split("data_").join("");
      firstBlock = false;
    } else if ((line.startsWith("data_") && !firstBlock)) {

      fileObj[datablockObj.datablock] = datablockObj;
      datablockObj = {};
      datablockObj["datablock"] = line.split("data_").join("");

    } else {

      if (line === "loop_") {

        dataname = "";
        if (precArray.length > 0) datablockObj = {
          ...datablockObj,
          ...elaborate(precArray, isLoop)
        };
        precArray = new Array();
        isLoop = true;

      } else if (dataname === "" && line.startsWith("_")) {

        dataname = line.split(".")[0];
        if (precArray.length > 0) elaborate(precArray, isLoop);
        precArray = new Array();
        precArray.push(line);
      } else if (dataname !== "" && dataname !== line.split(".")[0] && line.startsWith("_")) {

        dataname = line.split(".")[0];
        datablockObj = {
          ...datablockObj,
          ...elaborate(precArray, isLoop)
        };
        precArray = new Array();
        precArray.push(line);
        isLoop = false;


      } else {

        precArray.push(line);

      }
    }
  });

  fileObj[datablockObj.datablock] = datablockObj;

  return fileObj;


  function elaborate(dataArray, isLoop) {

    var valueArray = new Array();
    var nameArray = new Array();

    var dataName = "";

    var JSONObj = {};

    if (isLoop) {

      var contArray = new Array();

      dataArray.forEach(line => {

        line = line.trim();

        if (line.startsWith("_")) {
          dataName = line.split(".")[0];
          nameArray.push(line.split(".")[1]);
        } else {

          var field = "";
          var controlChar = " ";
          var pushed = false;

          for (let index = 0; index < line.length; index++) {

            if (controlChar === " " && line.charAt(index) === "'") { // check '

              controlChar = "'";
              pushed = false;

            } else if (controlChar === " " && line.charAt(index) === '"') { //check "

              controlChar = '"';
              pushed = false;

            } else if (controlChar === " " && line.charAt(index) === " ") {

              if (field.trim() !== "") valueArray.push(field);
              field = "";
              pushed = true;

            } else if (controlChar === "'" && line.charAt(index) === "'") {

              valueArray.push(field);
              field = "";
              controlChar = " ";
              pushed = true;

            } else if (controlChar === '"' && line.charAt(index) === '"') {

              valueArray.push(field);
              field = "";
              controlChar = " ";
              pushed = true;
            } else {

              field = field + line.charAt(index);
              pushed = false;

            }

          }

          if (!pushed) valueArray.push(field);
        }

      });

      var i = 0;
      var obj = {};
      for (let increment = 0; increment < valueArray.length; increment++) {

        if (i === nameArray.length) {
          i = 0;
          contArray.push(obj);
          obj = {};

        }

        obj[nameArray[i]] = valueArray[increment];
        i++;
      }

      contArray.push(obj);

      JSONObj[dataName] = contArray;

    } else {

      var dataName = dataArray.join("").trim().split(".")[0];

      dataArray = dataArray.join(" ").trim().split(dataName + ".").filter(v => v != '');

      var subObj = {};

      dataArray.forEach(line => {
        line = line.trim();
        var id = line.split(" ")[0];
        line = line.replace(id, "").trim();
        line = line.split("'").join("");
        subObj[id] = line;
      });

      JSONObj[dataName] = subObj;

    }

    return JSONObj;

  }

}