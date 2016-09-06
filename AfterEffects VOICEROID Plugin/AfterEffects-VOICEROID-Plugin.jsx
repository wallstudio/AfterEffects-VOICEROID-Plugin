

//共通設定

var maxNunChars = 10;   //最大キャラ数
var thumbnailFolder = "/c/Program Files/Adobe/Adobe After Effects CC 2015.3/Support Files/Scripts/Wall Studio Script/Thumbnail Cash";
var monitoringInterval = 750;
var thumbnailSize = 110;
var previewSize = 200;

//共有データ
var standCfgStr = "";
var monitoringFolders = (function () {
    var rtn = new Array(maxNunChars);
    for (var i = 0; i < maxNunChars; i++) {
        rtn[i] = new Object();
        rtn[i].path = "";
        //monitaring()では.pathが無ければ素通りするから↓の初期化は参照ボタン.onClickに任せてもいい？
        rtn[i].initFlg = false;
        rtn[i].oldList = new Array();
    }
    return rtn;
}());
var monitoringCounter = 0;
var taskID = 0;
var communicationPreviewDialog = "";
var standEnable = true;
var colors = (function () {
    var rtn = [];
    for (var i = 0; i < maxNunChars; i++) {
        rtn.push("#FFFFFF");
    }
    return rtn;
}());
var trans = (function () {
    var rtn = [];
    for (var i = 0; i < maxNunChars; i++) {
        rtn[i] = [1100, 500, 600, 600];
    }
    return rtn;
}());
var monitoringFoldersEnable = (function () {
    var rtn = [];
    for (var i = 0; i < maxNunChars; i++) {
        rtn[i] = true;
    }
    return rtn;
}());

//main
app.cancelTask(taskID);
var curentFolder = Folder.current.toString(); //ケツスラッシュはついてない
thumbnailFolderInit();
var mainPanel = createUI(this);
monitoring();



/*////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

          1.UIの実装

/////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/


function createUI(thisObj) {

    var mainPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "実況動画支援", xywh(200, 150, 210, 300));
    mainPanel.onClose = function () {

        //alert("STOP");
        app.cancelTask(taskID);
        writeLn("End WallStudioScript id:" + taskID + "(" + monitoringCounter + ")");

    }


    //監視間隔の設定
    var intervalLabel = mainPanel.add("statictext", xywh(5, 5, 100, 20), "監視の間隔(ms)");
    var intervalField = mainPanel.add("edittext", xywh(5, 30, 50, 20), monitoringInterval);
    var updataIntervalbutton = mainPanel.add("button", xywh(60, 30, 40, 20), "更新");
    updataIntervalbutton.onClick = function () {
        var interval = parseInt(intervalField.text);
        //例外OK
        if (interval && interval > 0) {
            monitoringInterval = intervalField.text;
        } else {
            intervalField.text = monitoringInterval;
            alert("不正な入力値");
        }
    };



    //デバッグ→緊急停止ボタン（パネルを閉じてもプロセスチェーンが残るのでこれで殺してから閉じてもらうき）
    var stopButton = mainPanel.add("button", xywh(102, 30, 20, 20), "×");
    stopButton.onClick = function () {
        app.cancelTask(taskID);
        writeLn("Cancel " + taskID + "(" + monitoringCounter + ")");
        //押しても消えないが内部オブジェクトは消えるようで、2回押すとエラーになるので無効
        //mainPanel.close();
    };
    //var popB = mainPanel.add("button", xywh(170, 30, 40, 20), "POP");
    //popB.onClick = function () {
    //    createChoiceStandDialogCushion(prompt("ID", "0"));
    //};




    //立ち絵設定ダイアログの呼び出し
    var callStandLabel = mainPanel.add("statictext", xywh(120, 5, 40, 20), "立ち絵");
    var callStandEnable = mainPanel.add("checkbox", xywh(160, 9, 20, 20));
    callStandEnable.value = true;
    callStandEnable.onClick = function () {
        standEnable = this.value;
    }
    var callStandButton = mainPanel.add("button", xywh(130, 30, 40, 20), "設定");
    callStandButton.onClick = function () {
        //ボタン
        createStandDialog();
    }


    //スクロールバー

    var scrollberLen = 200;
    var scrollber = mainPanel.add("scrollbar", xywh(182, 60, 18, 200), 0, 0, 100);
    scrollber.onChanging = function () {
        if (scrollber.enabled) {
            for (var i = 0; i < folders.length; i++) {
                folders[i].location.y = -this.value * ((maxNunChars * folderH - 200) / 100) + folderH * i;
            }
        }
    }

    //監視フォルダ設定

    var wrapFolders = mainPanel.add("panel", xywh(5, 60, 176, scrollberLen));
    var folderH = 81;
    var folders = [];
    for (var i = 1; i <= maxNunChars; i++) {
        var panel = wrapFolders.add("panel", xywh(0, 0 + folderH * (i - 1), 200, 80));
        //panel.children[n]でアクセスできる
        var folderLabel = panel.add("statictext", xywh(5, 3, 100, 20), "監視フォルダ" + i);
        var folderEnable = panel.add("checkbox", xywh(110, 7, 20, 20));
        folderEnable.charID = i - 1;
        folderEnable.value = monitoringFoldersEnable[i - 1];
        folderEnable.onClick = function () {
            monitoringFoldersEnable[this.charID] = this.value;
        }
        var folderField = panel.add("edittext", xywh(5, 27, 100, 20), "");  //ユーザーの直打ちはハンドルしない
        folderField.text = "未指定";
        var refButton = panel.add("button", xywh(110, 27, 40, 20), "参照");
        refButton.indexNun = i;
        refButton.onClick = function () {
            var folderObj = Folder.selectDialog("音声データを監視するフォルダを選択してください(キャラID:" + i + ")");
            //例外OK
            if (folderObj != null) {
                this.parent.children[2].text = folderObj.absoluteURI;
                var obj = new Object();
                obj.oldList = new Array();
                obj.path = this.parent.children[2].text;
                obj.initFlg = true;

                monitoringFolders[this.indexNun - 1] = obj;
            }
        }

        var idLabel = panel.add("statictext", xywh(5, 52, 70, 20), "キャラID");
        //未実装
        var id = panel.add("dropdownlist", xywh(50, 52, 40, 20), (function (n) {
            var rtn = []; for (var j = 1; j <= maxNunChars; j++) { rtn[j - 1] = j; } return rtn
        }(maxNunChars)));
        id.selection = i - 1;

        var colorLabel = panel.add("statictext", xywh(95, 52, 20, 20), "色");
        var colorField = panel.add("edittext", xywh(115, 52, 55, 20), colors[i]);
        colorField.charID = i;
        colorField.onChange = function () {
            //例外OK
            if (this.text.match(/^#[(0-9)(A-F)(a-f)]{6}$/)) {
                colors[this.charID - 1] = this.text;
                this.graphics.backgroundColor = this.graphics.newBrush(this.graphics.PenType.SOLID_COLOR, colorArray16Change(colors[this.charID - 1] + "FF"), 1);
            } else { alert("不正値"); }
        }

        folders[i - 1] = panel;
    }
    return mainPanel;
}


function createStandDialog() {


    var standDialog = new Window("dialog", "実況動画支援立ち絵設定", xywh(200, 150, 1200, 680));

    //コントロール
    var importButton = standDialog.add("button", xywh(10, 10, 80, 20), "インポート");
    importButton.onClick = function () {
        importStandCfg(chars);
    }
    var exportButton = standDialog.add("button", xywh(100, 10, 80, 20), "エクスポート");
    exportButton.onClick = function () {
        exportStandCfg(chars);
    };

    //スクロールバー
    var wrapH = 600;
    var scrollber = standDialog.add("scrollbar", xywh(1180, 50, 18, wrapH), 0, 0, 100);
    scrollber.onChanging = function () {
        if (scrollber.enabled) {
            for (var i = 0; i < chars.length; i++) {
                chars[i].location.y = -this.value * ((maxNunChars * charPanelH - wrapH) / 100) + charPanelH * i;
            }
        }
    }


    var wrapChars = standDialog.add("panel", xywh(10, 50, 1170, wrapH));
    var chars = [];
    var charPanelH = 330    //100x100で30個ぐらい突っ込める
    var charIconW = thumbnailSize;    //20pxは参照で減る，実質110x90
    var iconColumns = Math.round((1180 - 60) / (charIconW + 1));
    var iconRow = Math.round(charPanelH / (charIconW + 1));
    var notSelectedIconFileObj = new File(curentFolder + "/notSelectedIcon.png");
    //例外OK
    if (!notSelectedIconFileObj.exists) {
        alert("\"notSelectedIcon.png\"が見つかりません");
        return;
    }
    for (var i = 0; i < maxNunChars; i++) {
        //キャラごとの設定の中身
        var panel = wrapChars.add("panel", xywh(0, 0 + charPanelH * i, 1180, charPanelH));
        //panel.children[n]でアクセスできる
        var noLabel = panel.add("statictext", xywh(0, 0, 40, 20), "#" + (i + 1));
        var name = panel.add("edittext", xywh(0, 30, 65, 20), "メモ");
        var transeFieldsChange = function () {
            var pxValue = parseInt(this.text);
            if (pxValue >= 0) {
                trans[this.charID][this.transeType] = pxValue;
            }
        }
        var putXLabel = panel.add("statictext", xywh(5, 75, 15, 20), "x:");
        var putX = panel.add("edittext", xywh(20, 75, 38, 20), trans[i][0]);
        putX.transeType = 0; putX.charID = i;
        putX.onChange = transeFieldsChange;
        var putYLabel = panel.add("statictext", xywh(5, 100, 15, 20), "y:");
        var putY = panel.add("edittext", xywh(20, 100, 38, 20), trans[i][1]);
        putY.transeType = 1; putY.charID = i;
        putY.onChange = transeFieldsChange;
        var putWLabel = panel.add("statictext", xywh(5, 125, 15, 20), "w:");
        var putW = panel.add("edittext", xywh(20, 125, 38, 20), trans[i][2]);
        putW.transeType = 2; putW.charID = i;
        putW.onChange = transeFieldsChange;
        var putHLabel = panel.add("statictext", xywh(5, 150, 15, 20), "h:");
        var putH = panel.add("edittext", xywh(20, 150, 38, 20), trans[i][3]);
        putH.transeType = 3; putH.charID = i;
        putH.onChange = transeFieldsChange;
        var icons = [];
        for (var j = 0; j < iconColumns * iconRow; j++) {
            //1つ1つのセル
            icons[j] = panel.add("panel", xywh(65 + charIconW * (j % iconColumns), 0 + charIconW * Math.floor(j / iconColumns), charIconW, charIconW));
            if (notSelectedIconFileObj.exists) {
                var iconBotton = icons[j].add("iconbutton", xywh(1, 1, charIconW, charIconW), notSelectedIconFileObj);
                iconBotton.imagePath = notSelectedIconFileObj.fsName;
                iconBotton.onClick = function () {
                    var newImage = File.openDialog("新しい立ち絵を選んでください");
                    if (newImage) {
                        var thumbnail = imageSizeDown(newImage.toString(), charIconW);
                        var thumObj = new File(thumbnail);
                        //例外OK
                        if (thumObj) {
                            this.icon = thumObj;
                            this.imagePath = thumbnail;   //回収データ
                            this.srcPath = newImage.toString();
                            this.prePath = imageSizeDown(newImage.toString(), previewSize)
                            exportStandCfg(chars, standCfgStr);
                        } else { alert("サムネイルの生成エラー"); }

                    }
                }

            }
            icons[j].add("statictext", xywh(0, 0, 40, 20), "#" + j);
        }
        panel.icons = icons;
        chars[i] = panel;
    }
    if (standCfgStr != "") {
        importStandCfg(chars, standCfgStr);
    }
    standDialog.show();
}


function xywh(x, y, w, h) {
    //例外OK
    if (typeof x == "number" && typeof y == "number" && typeof w == "number" && typeof h == "number") {
        return [x, y, x + w, y + h];
    }
    alert("Vector4座標指定が不正");
}


function colorArray16Change(color) {
    //例外OK
    if (Array.isArray(color)) {
        var rtn = "#"
        for (var i = 0; i < color.length; i++) {
            rtn += Math.round(color[i] * 255).toString(16);
        }
        return rtn;
    } else if (typeof color == "string") {
        var rtn = []
        for (var i = 0; i < (color.length - 1) / 2; i++) {
            var str16 = color.substr(i * 2 + 1, 2);
            rtn.push(parseInt(str16, 16) / 255);
        }
        return rtn;
    }
    alert("内部エラー：色指定が不正");
}


function thumbnailFolderInit() {
    var folder = new Folder(thumbnailFolder);
    if (!folder.exists) {
        folder.create();
    }
}


function imageSizeDown(src, size) {

    var filename = ("000000000000" + Math.floor(Math.random() * 1000000000000)).slice(-12) + "_" + src.split("/").pop();

    var reg1 = new RegExp("^/([a-z])");
    var reg2 = new RegExp("^~");
    var reg3 = new RegExp("/", "g");

    var stdIn = "\"" + decodeURI(curentFolder).replace(reg1, "$1:").replace(reg2, "%homepath%").replace(reg3, "\\") + "\\ri.exe\"";
    stdIn += " \"" + decodeURI(src).replace(reg1, "$1:").replace(reg2, "%homepath%").replace(reg3, "\\") + "\"";    //第一：リソース
    stdIn += " \"" + decodeURI(thumbnailFolder).replace(reg1, "$1:").replace(reg2, "%homepath%").replace(reg3, "\\") + "\\" + decodeURI(filename) + ".png\"";    //第二：出力
    stdIn += " " + size;    //第三：大きさ

    var stdOut = system.callSystem(stdIn);
    //例外OK
    if (stdOut.match("prm_error")) {
        alert(stdOut);
    }
    if (stdOut.match("Complete")) {
        //alert("OK");
    }
    return thumbnailFolder + "/" + filename + ".png";
}


function importStandCfg(chars, intraMem) {
    var importStr = "";
    if (intraMem != null) {
        importStr = standCfgStr;
    } else {
        var importFile = File.openDialog("インポートするファイル");
        if (importFile) {
            importFile.open("r");
            importStr = importFile.read();
            importFile.close();
        } else { return; }
    }
    var jsonObj = JSON.parse(importStr);

    for (var i = 0; i < chars.length; i++) {
        //各キャラ
        var panel = chars[i];
        for (var j = 0; j < panel.icons.length; j++) {
            //各セルを調査
            var imgFile = new File(jsonObj[i][j][1]);
            //例外OK
            if (imgFile) {
                panel.icons[j].children[0].icon = imgFile;

                panel.icons[j].children[0].srcPath = jsonObj[i][j][0];
                panel.icons[j].children[0].imagePath = jsonObj[i][j][1];
                panel.icons[j].children[0].prePath = jsonObj[i][j][2];

            } else { alert("インポートエラー"); }
        }
    }
    exportStandCfg(chars, standCfgStr);
}


function exportStandCfg(chars, intraMem) {


    var exportStr = "[\n";

    var cellses = [];
    for (var i = 0; i < chars.length; i++) {
        //各キャラ
        var panel = chars[i];

        var cells = [];
        for (var j = 0; j < panel.icons.length; j++) {
            //各セルを調査
            var srcData = panel.icons[j].children[0].srcPath;
            var iconData = panel.icons[j].children[0].imagePath;
            var preData = panel.icons[j].children[0].prePath;
            //alert(iconData);
            cells[j] = "[\"" + srcData + "\",\"" + iconData + "\",\"" + preData + "\"]";
        }
        cellses[i] = "    [" + cells.join(",") + "]";
    }
    exportStr += cellses.join(",\n");

    exportStr += "\n]";

    exportStr = exportStr.replace(/\\/g, "\\\\");

    if (intraMem != null) {
        standCfgStr = exportStr;
    } else {
        var exportPath = File.saveDialog("設定ファイルの保存先を決めてください", "*.js");
        if (exportPath) {
            var saveCfgFile = new File(exportPath);
            //例外OK
            if (saveCfgFile) {
                saveCfgFile.open("w");
                saveCfgFile.write(exportStr);
                saveCfgFile.close();
            } else { alert("エクスポートエラー"); }
        }
    }
}



/*////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

        2.監視ルーチンの実装
        3.フォルダの中身の変化の検出パス取得

/////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

function monitoring() {

    monitoringCounter++;

    for (var i = 0; i < monitoringFolders.length; i++) {
        //disableなら何もしない
        if (!monitoringFoldersEnable[i]) { continue; }
        //パスが指定されていなければ何もしない
        if (monitoringFolders[i].path == "" || monitoringFolders[i].path == "未指定") { continue; }

        var folObj = new Folder(monitoringFolders[i].path);
        var fileObjs = folObj.getFiles("*.wav");
        var filePathes = [];
        for (var j = 0; j < fileObjs.length; j++) {
            filePathes[j] = fileObjs[j].fsName;
        }


        //oldListがあるなら比較する
        if (Array.isArray(monitoringFolders[i].oldList)) {
            if (monitoringFolders[i].initFlg) {
                if (filePathes.length > 0) {
                    alert("監視ディレクトリに初めからWAVAファイルがあります\nこれらはスキップされました\n" + filePathes.join("\n"));
                }
                monitoringFolders[i].initFlg = false;
                writeLn("監視フォルダの更新");
            } else {
                var deff = setDiff(filePathes, monitoringFolders[i].oldList);
                if (deff.length == 1) {
                    createLayer(deff[0], i);
                } else if (deff.length > 1) {
                    alert("複数更新を検知しました\n後に検知されたファイルは反映されていませんので確認してください");
                }
            }
        }
        //oldListを更新する
        monitoringFolders[i].oldList = filePathes;




    }

    taskID = app.scheduleTask("monitoring()", monitoringInterval, false);
    writeLn("監視中(" + monitoringCounter + ")");
}

//  Set1∪Set2 未使用
function setInter(set1, set2) {
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
}

//  Set1＼Set2
function setDiff(set1, set2) {

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
}


/*////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

        4.音声をアイテムへ追加
        5.レイヤーへの配置
        6.開始とデュレーションの取得
        7.字幕を配置
        9.立ち絵の配置   

/////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/


function createLayer(path, id) {

    //調査
    var fileObj = new File(path);
    //例外OK
    if (!fileObj) {
        alert("音声の読み込みに失敗");
        return;
    }
    var audio = app.project.importFile(new ImportOptions(fileObj));
    var fname = fileObj.name;
    var duration = audio.duration;

    var text = "";
    var textFileObj = new File(path.replace(/\.wav$/, ".txt"));
    //例外OK
    if (textFileObj && textFileObj.open("r")) {
        text = textFileObj.read();
        textFileObj.close();
    } else {
        alert("テキストが開けません\n代わりにファイルネームを使用します");
        text = fname.replace(/\.wav$/, "");
    }

    var targetComp = app.project.activeItem;
    //例外OK
    if (!(targetComp instanceof CompItem)) {
        alert("選択されているタイムラインに追加できません\n追加可能なコンポジションであることを\n確認してください");
        return;
    }
    var nowTime = targetComp.time;

    var compW = targetComp.width;
    var compH = targetComp.height;

    var standPath = standEnable ? createChoiceStandDialogCushion(id) : null;


    //音声追加
    var audioLayer = targetComp.layers.add(audio);
    audioLayer.startTime = nowTime;



    //立ち絵追加
    //例外OK
    if (standPath) {
        var standFileObj = new File(standPath);
        //例外OK
        if (standFileObj) {
            var stand = app.project.importFile(new ImportOptions(standFileObj));
            var standLayer = targetComp.layers.add(stand);

            standLayer.startTime = nowTime;
            standLayer.outPoint = nowTime + duration;
            standLayer("position").setValue([trans[id][0], trans[id][1]]);
            var srcW = stand.width;
            var srcH = stand.height;
            var scale = (srcW > srcH ? trans[id][2] / srcW * 100 : trans[id][3] / srcH * 100);
            standLayer("scale").setValue([scale, scale]);
            standLayer("Opacity").expression = "transform.opacity = easeIn(time, inPoint, inPoint + 0.10, 0, 100) * ease(time, outPoint - 0.15, outPoint, 100, 0) / 100;";
        } else { alert("立ち絵ファイルが開けません"); }
    }



    //字幕追加
    var textLayer = targetComp.layers.addBoxText([compW * 0.8, compH * 0.3], text);

    textLayer.startTime = nowTime;
    textLayer.outPoint = nowTime + duration
    var textCfg = textLayer.property("Source Text").value;

    //textCfg.resetCharStyle();
    textCfg.fontSize = compH / 16;
    var baseColor = colorArray16Change(colors[id]);
    var baseColorHLS = toHLS(baseColor);
    textCfg.fillColor = toRGB(baseColorHLS[0], 1 - (1 - baseColorHLS[1]) * 0.4, baseColorHLS[2]);
    textCfg.strokeColor = toRGB(baseColorHLS[0], baseColorHLS[1] * 0.6, baseColorHLS[2]);
    //textCfg.strokeWidth = 2;
    //textCfg.font = "HG丸ｺﾞｼｯｸM-PRO";
    //textCfg.strokeOverFill = true;
    //textCfg.applyStroke = true;
    //textCfg.applyFill = true;
    //textCfg.fauxBold = true;
    //textCfg.text = text;
    textCfg.justification = ParagraphJustification.CENTER_JUSTIFY;
    //textCfg.tracking = 50;
    textLayer.property("Source Text").setValue(textCfg);

    textLayer("anchorPoint").setValue([0, compH / 8]);
    textLayer("position").setValue([compW / 2, compH]);
    textLayer("Opacity").expression = "transform.opacity = easeIn(time, inPoint, inPoint + 0.10, 0, 100) * ease(time, outPoint - 0.15, outPoint, 100, 0) / 100;";



}

//未使用
function peekee(value, rate) {
    value += rate;
    if (value < 0) {
        value = 0;
    } else if (value > 1) {
        value = 1;
    }
    return value;
}

//未使用
function peekeeSmooth(value, rate) {
    if (rate > 0) {
        value = 1 - (1 - value) * rate;
    } else {
        value = -value * rate;
    }
    return value;
}


function toHLS(r, g, b) {


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
}


function toRGB(h, l, s) {

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
}





/*////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

        8.立ち絵の選択ウィンドウUIの表示

/////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/


function createChoiceStandDialog(id) {

    var chosen = "";
    var choiceStandDialog = new Window("dialog", "実況動画支援立ち絵選択", xywh(200, 150, 1020, 680));

    //コントロール
    var page1Button = choiceStandDialog.add("button", xywh(10, 10, 30, 30), "1");
    page1Button.active = true;
    page1Button.onClick = function () {

        page1Button.active = true;
        page[0].visible = true;

        page2Button.active = false;
        page[1].visible = false;

    };
    var page2Button = choiceStandDialog.add("button", xywh(45, 10, 30, 30), "2");
    page2Button.onClick = function () {

        page2Button.active = true;
        page[1].visible = true;

        page1Button.active = false;
        page[0].visible = false;

    };

    var page = [];
    for (var i = 0; i < 2 ; i++) {

        //ページ1
        page[i] = choiceStandDialog.add("panel", xywh(10, 50, 1000, 600));
        var pageLabel = page[i].add("statictext", xywh(0, 0, 40, 20), "#" + (i + 1));

        page[i].visible = (i == 0);
    }

    if (standCfgStr == "") {
        alert("立ち絵がセットされていません");
        return;
    }
    var jsonObj = JSON.parse(standCfgStr);
    //例外?OK
    for (var i = 0; i < jsonObj[id].length; i++) {
        if (jsonObj[id][i][2] == null || jsonObj[id][i][2] == "undefined") {
            jsonObj[id][i][2] = curentFolder + "/notSelectedIcon.png";
        }
    }


    for (var i = 0; i < 29; i++) {
        var x, y;
        var nunColmuns = Math.floor(1000 / previewSize);
        var nunRows = Math.floor(600 / previewSize);
        var maxNunCells = nunColmuns * nunRows;

        var pageNo = Math.floor(i / maxNunCells);
        var x = (i % maxNunCells % nunColmuns) * previewSize;
        var y = Math.floor((i % maxNunCells) / nunColmuns) * previewSize;
        var preview = page[pageNo].add("panel", xywh(x, y, previewSize, previewSize));
        var path = jsonObj[id][i][2];
        var previewImageObj = new File(path);
        //例外OK
        if (previewImageObj) {
            var previewImage = preview.add("iconbutton", xywh(1, 1, previewSize, previewSize), previewImageObj);
            previewImage.window = choiceStandDialog;
            previewImage.srcPath = jsonObj[id][i][0];
            previewImage.onClick = function () {

                communicationPreviewDialog = this.srcPath;
                this.window.close();

            }
        } else { alert("プレビュー画像が読み込めません"); }
        var previewLabel = preview.add("statictext", xywh(0, 0, 40, 20), "#" + (i + 1));

    }



    choiceStandDialog.show();
}


function createChoiceStandDialogCushion(id) {

    communicationPreviewDialog = "";
    createChoiceStandDialog(id);
    return communicationPreviewDialog;

}






/*
    開発メモ
    
    1.UIの実装
        パレット
            監視間隔[       ][更新]
            
            監視フォルダ1[        ]参照
            キャラID[      ]色[     ]
            監視フォルダ2[        ]参照
            キャラID[      ]色[     ]
            監視フォルダ3[        ]参照
            キャラID[      ]色[     ]
            監視フォルダ4[        ]参照
            キャラID[      ]色[     ]
            監視フォルダ5[        ]参照
            キャラID[      ]色[     ]
            監視フォルダ6[        ]参照
            キャラID[      ]色[     ]
            
            [立ち絵セット]    -> ウィンドウ
            
        ウィンドウ
            ID|1|2|3|4|5|6|
            1[                  ]
            2[                  ]
            3[                  ]
            4[                  ]
            5[                  ]
            6[                  ]
            7[                  ]
            8[                  ]
            
            [インポート][エクスポート]
    
    2.監視ルーチンの実装
    3.フォルダの中身の変化の検出パス取得
    4.音声をアイテムへ追加
    5.レイヤーへの配置
    6.開始とデュレーションの取得
    7.字幕を配置
    8.立ち絵の選択ウィンドウUIの表示
    9.立ち絵の配置   
    
    
    
*/