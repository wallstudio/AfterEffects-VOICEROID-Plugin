//本体から内部完結した機能を分割するファイル
//$.evalFile() でインポートする



var wsFunc ={

    repeat : function (obj, length) {
        if (typeof obj == "undefined") { obj = 0; }
        var rtn = [];
        for (var i = 0; i < length; i++) {
            rtn.push(obj);
        }
        return rtn;
    },



    xywh : function (x, y, w, h) {
        //例外OK
        if (typeof x == "number" && typeof y == "number" && typeof w == "number" && typeof h == "number") {
            return [x, y, x + w, y + h];
        }
        alert("座標に数以外が紛れ込んでいる");
    },



    colorNumCode: function (codeOrArray) {

        //例外OK
        if (Array.isArray(codeOrArray)) {
            var rtn = "#"
            for (var i = 0; i < codeOrArray.length; i++) {
                rtn += Math.round(codeOrArray[i] * 255).toString(16);
            }
            return rtn;
        } else if (typeof codeOrArray == "string") {
            var rtn = []
            for (var i = 0; i < (codeOrArray.length - 1) / 2; i++) {
                var str16 = codeOrArray.substr(i * 2 + 1, 2);
                rtn.push(parseInt(str16, 16) / 255);
            }
            return rtn;
        }
        alert("内部エラー：色指定が不正");

    },



    //  Set1∪Set2 
    setInter: function (set1, set2) {
        //例外OK
        if (!Array.isArray(set1) || !Array.isArray(set2)) { return []; }
        var rtn = [];
        for (var i = 0; i < set1.length; i++) {
            for (var j = 0; j < set2.length; j++) {
                if (set1[i] == set2[j]) {
                    rtn.push(set1[i]);
                }
            }
        }
        return rtn;
    },



    //  Set1＼Set2
    setDif: function (set1, set2) {

        //例外OK
        if (!Array.isArray(set1) || !Array.isArray(set2)) { return []; }
        //配列のコピー
        var rtn = set1.slice();
        for (var i = 0; i < set2.length; i++) {
            var index = rtn.indexOf(set2[i]);
            if (index >= 0) {
                rtn.splice(index, 1);
            }
        }
        return rtn;
    },



    //未使用
    peekee: function (value, rate) {
        value += rate;
        if (value < 0) {
            value = 0;
        } else if (value > 1) {
            value = 1;
        }
        return value;
    },



    //未使用
    peekeeSmooth: function (value, rate) {
        if (rate > 0) {
            value = 1 - (1 - value) * rate;
        } else {
            value = -value * rate;
        }
        return value;
    },



    toHLS : function (r, g, b) {


        if (Array.isArray(r)) {
            b = r[2];
            g = r[1];
            r = r[0];
        }

        //境界値保護
        r = r > 0.9999999999 ? 0.9999999999 : r;
        g = g > 0.9999999999 ? 0.9999999999 : g;
        b = b > 0.9999999999 ? 0.9999999999 : b;
        r = r < 0.0000000001 ? 0.0000000001 : r;
        g = g < 0.0000000001 ? 0.0000000001 : g;
        b = b < 0.0000000001 ? 0.0000000001 : b;

        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);

        var h = max - min;
        if (h > 0.0) {
            if (max == r) {
                h = (g - b) / h;
                if (h < 0.0) {
                    h += 6.0;
                }
            } else if (max == g) {
                h = 2.0 + (b - r) / h;
            } else {
                h = 4.0 + (r - g) / h;
            }
        }
        h /= 6.0;

        var l = (max + min) / 2;

        var s = (max - min) / (1 - Math.abs(max + min - 1));


        var rtn = [Math.abs(h), Math.abs(l), Math.abs(s)]

        //境界値保護
        for (var i = 0; i < rtn.length; i++) {
            rtn[i] = rtn[i] > 0.9999999999 ? 0.9999999999 : rtn[i];
            rtn[i] = rtn[i] < 0.0000000001 ? 0.0000000001 : rtn[i];
        }

        return rtn;
    },



    toRGB : function (h, l, s) {

        if (Array.isArray(h)) {
            s = h[2];
            l = h[1];
            h = h[0];
        }


        //境界値保護
        s = s > 0.9999999999 ? 0.9999999999 : s;
        l = l > 0.9999999999 ? 0.9999999999 : l;
        h = h > 0.9999999999 ? 0.9999999999 : h;
        s = s < 0.0000000001 ? 0.0000000001 : s;
        l = l < 0.0000000001 ? 0.0000000001 : l;
        h = h < 0.0000000001 ? 0.0000000001 : h;


        h *= 360;
        if (h >= 360) {
            h -= 360;
        }
        var max = l + s / 2 * (1 - Math.abs(2 * l - 1));
        var min = l - s / 2 * (1 - Math.abs(2 * l - 1));

        var rtn = [];

        if (h == null) {
            rtn = [max, max, max];
        } else if (0 <= h && h < 60) {
            rtn = [max, min + (max - min) * h / 60, min];
        } else if (60 <= h && h < 120) {
            rtn = [min + (max - min) * (120 - h) / 60, max, min];
        } else if (120 <= h && h < 180) {
            rtn = [min, max, min + (max - min) * (h - 120) / 60];
        } else if (180 <= h && h < 240) {
            rtn = [min, min + (max - min) * (240 - h) / 60, max];
        } else if (240 <= h && h < 300) {
            rtn = [min + (max - min) * (h - 240) / 60, min, max];
        } else if (300 <= h && h < 360) {
            rtn = [max, min, min + (max - min) * (360 - h) / 60];
        }

        rtn = [Math.abs(rtn[0]), Math.abs(rtn[1]), Math.abs(rtn[2])];



        //境界値保護
        for (var i = 0; i < rtn.length; i++) {
            rtn[i] = rtn[i] > 0.9999999999 ? 0.9999999999 : rtn[i];
            rtn[i] = rtn[i] < 0.0000000001 ? 0.0000000001 : rtn[i];
        }

        return rtn;
    },



    importJsonFile : function (path){
        //引数が無ければダイアログを出す
        while (!path) {
            var selectedFileObj = File.openDialog("JSONファイルを選んでください");
            //キャンセルボタンが押されたとき
            if (!selectedFileObj) {
                return;
            }
            path = selectedFileObj.fsName;
            selectedFileObj.close();
        }

        var jsonFileObj = new File(path);
        if (!jsonFileObj.open("r")) {
            alert("ファイルの読み込みエラーです");
            jsonFileObj.close();
            return;
        }
        var jsonString = jsonFileObj.read();
        jsonFileObj.close();

        return JSON.parse(jsonString);
    },



    exportJsonFile: function (jsonObj, path) {
        //第2引数が無ければダイアログを出す
        while (!path) {
            var selectedFileObject = File.saveDialog("設定ファイルの保存先を決めてください", "*.js");
            //キャンセルボタンが押されたとき
            if (!selectedFileObject) {
                return;
            }
            path = selectedFileObject.fsName;
            selectedFileObject.close();
        }

        var jsonFileObj = new File(path);
        if (!jsonFileObj.open("w")) {
            alert("JSONファイルの書き込みエラーです(1)");
            jsonFileObj.close();
            return;
        }
        var jsonString = JSON.stringify(jsonObj);
        
        var status = jsonFileObj.write(jsonString);
        jsonFileObj.close();
        if (!status) {
            alert("JSONファイルの書き込みエラーです(2)");
        }
        return status;
    },



    getFilesSafty: function (path) {
        //引数が無ければダイアログを出す
        while (!path) {
            var selectedFolderObj = Folder.selectDialog("フォルダを選んでください");
            //キャンセルボタンが押されたとき
            if (!selectedFolderObj) {
                return;
            }
            path = selectedFolderObj.fsName;
        }

        var folderObj = new Folder(path);
        if (!folderObj) {
            alert("フォルダが開けません");
            return;
        }
        
        var fileObjs = folderObj.getFiles("*.png");
        if (fileObjs.length < 1 || !fileObjs) {
            alert("ファイルがありません");
            return;
        }
        //ファイルのオープンチェック
        for (var i = 0; i < fileObjs.length; i++) {
            if (!fileObjs[i]) {
                alert("読み込めないファイルがあります");
                return;
            }
        }
        
        return fileObjs;
    }

}
