
programFolder = "/c/Program Files/Adobe/Adobe After Effects CC 2015.3/Support Files/Scripts/ScriptUI Panels/Wall Studio Script"
$.evalFile("Wall Studio Script/wsFunc.jsx");
//JSONクラスのロードに先行してしまう？
commonSettingObj = null;
//commonSettingObj = wsFunc.importJsonFile(programFolder + "/sample_setting.json");
autoSavePath = programFolder + "/autoSave_setting.json";

//グローバル変数宣言
mainPanel = null;
uiConfigObj = null;
previewDialog = null;

taskId = null;
monitoringSign = null;
oldList = wsFunc.repeat(null, 6);
communicationPreviewDialog = null;

//Main
app.scheduleTask("preload()", 5000, false);
mainPanel = createUIPallete(this);


function preload() {
    commonSettingObj = wsFunc.importJsonFile(programFolder + "/sample_setting.json");
    mainPanel.visibleSwiche(true);
    writeLn("VOICEROID Plugin 初期化完了");
}
/*////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

          1.UIの実装

/////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/


//新UI


function createUIPallete(thisObj) {

    //描画設定
    var pallete =  (thisObj instanceof Panel) ? thisObj : new Window("window", "", wsFunc.xywh(50, 50, 210, 500));

    pallete.loadingLabel = pallete.add("statictext", wsFunc.xywh(15, 15, 100, 20), "初期化中…");
    pallete.monitoringLabel = pallete.add("statictext", wsFunc.xywh(45, 5, 50, 20), "監視");
    monitoringSign = pallete.monitoringSign = pallete.add("statictext", wsFunc.xywh(30, 5, 50, 20), "■");
    pallete.monitoringONButton = pallete.add("button", wsFunc.xywh(5, 25, 50, 20), "ON");
    pallete.monitoringOFFButton = pallete.add("button", wsFunc.xywh(60, 25, 50, 20), "OFF");

    pallete.quickLoadButton = pallete.add("button", wsFunc.xywh(5, 60, 50, 20), "Qロード");
    pallete.configButton = pallete.add("button", wsFunc.xywh(60, 60, 50, 20), "設定");
    pallete.loadButton = pallete.add("button", wsFunc.xywh(5, 85, 50, 20), "ロード");
    pallete.saveButton = pallete.add("button", wsFunc.xywh(60, 85, 50, 20), "セーブ");

    pallete.yukarinIcon = pallete.add("image", wsFunc.xywh(120, 20, 75, 80), new File(programFolder + "/yuka.png"));


    //ロジック
    pallete.monitoringONButton.onClick = function () {
        this.activ = true;
        this.parent.monitoringONButton = false;
        taskId = app.scheduleTask("monitoring()", 800, true);
    };
    pallete.monitoringOFFButton.onClick = function () {
        this.parent.monitoringOFFButton = false;
        app.cancelTask(taskId);
    };
    pallete.configButton.onClick = function () {
        uiConfigObj = createUIConfig();
        uiConfigObj.show();
    };
    pallete.quickLoadButton.onClick = function () {
        commonSettingObj = wsFunc.importJsonFile(autoSavePath);
    }
    pallete.loadButton.onClick = function () {
        commonSettingObj = wsFunc.importJsonFile();
        wsFunc.exportJsonFile(commonSettingObj, autoSavePath);
    }
    pallete.saveButton.onClick = function () {
        wsFunc.exportJsonFile(commonSettingObj);
    }

    //初期化中は隠す
    pallete.visibleSwiche = function (enable) {
        this.loadingLabel.visible = !enable;
        this.monitoringLabel.visible = enable;
        monitoringSign.visible = enable;
        this.monitoringONButton.visible = enable;
        this.monitoringOFFButton.visible = enable;
        this.quickLoadButton.visible = enable;
        this.configButton.visible = enable;
        this.loadButton.visible = enable;
        this.saveButton.visible = enable;
        this.yukarinIcon.visible = enable;
    }
    pallete.visibleSwiche(false);

    return pallete;
}


function createUIConfig() {

    //描画
    var config = new Window("window", "設定", wsFunc.xywh(200, 150, 1210, 710));
    config.charGroup = [];
    for (var i = 0; i < 6; i++) {
        config.charGroup[i] = config.add("panel", wsFunc.xywh(610 * (i % 2), 235 * Math.floor(i / 2), 600, 500));
        var ccg = config.charGroup[i];
        ccg.label = ccg.add("statictext", wsFunc.xywh(0, 0, 100, 20), "キャラ" + (i+1));
        ccg.enable = ccg.add("checkbox", wsFunc.xywh(45, 3, 20, 20));
        ccg.testButton = ccg.add("button", wsFunc.xywh(540, 0, 50, 20), "テスト");

        ccg.general = ccg.add("panel", wsFunc.xywh(0, 20, 200, 220));
        ccg.general.label = ccg.general.add("statictext", wsFunc.xywh(5, 5, 300, 20), "一般");
        ccg.general.nameLabel = ccg.general.add("statictext", wsFunc.xywh(15, 50, 300, 20), "   名前");
        ccg.general.name = ccg.general.add("edittext", wsFunc.xywh(90, 50, 80, 20), "NAME");
        ccg.general.memoLabel = ccg.general.add("statictext", wsFunc.xywh(18, 75, 100, 20), "   メモ");
        ccg.general.memo = ccg.general.add("edittext", wsFunc.xywh(90, 75, 80, 20), "MEMO");
        ccg.general.monitoringFolderLabel = ccg.general.add("statictext", wsFunc.xywh(15, 100, 300, 20), "監視ﾌｫﾙﾀﾞ");
        ccg.general.monitoringFolder = ccg.general.add("edittext", wsFunc.xywh(20, 120, 110, 20), "FOLDER");
        ccg.general.monitoringFolderButton = ccg.general.add("button", wsFunc.xywh(133, 120, 50, 20), "参照");

        ccg.subtitles = ccg.add("panel", wsFunc.xywh(200, 20, 200, 220));
        ccg.subtitles.label = ccg.subtitles.add("statictext", wsFunc.xywh(5, 5, 300, 20), "字幕");
        ccg.subtitles.enable = ccg.subtitles.add("checkbox", wsFunc.xywh(40, 8, 20, 20));
        ccg.subtitles.colorLabel = ccg.subtitles.add("statictext", wsFunc.xywh(15, 50, 300, 20), "    色");
        ccg.subtitles.color = ccg.subtitles.add("edittext", wsFunc.xywh(90, 50, 60, 20),"#FFFFFF");
        ccg.subtitles.xLabel = ccg.subtitles.add("statictext", wsFunc.xywh(10, 75, 300, 20), "水平位置0~1");
        ccg.subtitles.x = ccg.subtitles.add("edittext", wsFunc.xywh(90, 75, 60, 20), "X");
        ccg.subtitles.yLabel = ccg.subtitles.add("statictext", wsFunc.xywh(10, 100, 100, 20), "垂直位置0~1");
        ccg.subtitles.y = ccg.subtitles.add("edittext", wsFunc.xywh(90, 100, 60, 20), "Y");
        ccg.subtitles.sizeLabel = ccg.subtitles.add("statictext", wsFunc.xywh(15, 125, 300, 20), "  サイズ");
        ccg.subtitles.sizel = ccg.subtitles.add("edittext", wsFunc.xywh(90, 125, 60, 20), "SIZE");
        ccg.subtitles.fontLabel = ccg.subtitles.add("statictext", wsFunc.xywh(15, 150, 300, 20), " フォント");
        ccg.subtitles.font = ccg.subtitles.add("edittext", wsFunc.xywh(90, 150, 100, 20), "FONT");


        ccg.stand = ccg.add("panel", wsFunc.xywh(400, 20, 200, 220));
        ccg.stand.label = ccg.stand.add("statictext", wsFunc.xywh(5, 5, 300, 20), "立絵");
        ccg.stand.enable = ccg.stand.add("checkbox", wsFunc.xywh(40, 8, 20, 20))
        ccg.stand.mirrorLabel = ccg.stand.add("statictext", wsFunc.xywh(95, 22, 300, 20), "反転");
        ccg.stand.mirror = ccg.stand.add("checkbox", wsFunc.xywh(130, 25, 20, 20));
        ccg.stand.xLabel = ccg.stand.add("statictext", wsFunc.xywh(10, 50, 300, 20), "水平位置0~1");
        ccg.stand.x = ccg.stand.add("edittext", wsFunc.xywh(90, 50, 60, 20), "X");
        ccg.stand.yLabel = ccg.stand.add("statictext", wsFunc.xywh(10, 75, 100, 20), "垂直位置0~1");
        ccg.stand.y = ccg.stand.add("edittext", wsFunc.xywh(90, 75, 60, 20), "Y");
        ccg.stand.sizeLabel = ccg.stand.add("statictext", wsFunc.xywh(15, 100, 300, 20), " サイズpx");
        ccg.stand.sizel = ccg.stand.add("edittext", wsFunc.xywh(90, 100, 60, 20), "SIZE");
        ccg.stand.angleLabel = ccg.stand.add("statictext", wsFunc.xywh(15, 125, 300, 20), " 向き0~1");
        ccg.stand.angle = ccg.stand.add("edittext", wsFunc.xywh(90, 125, 60, 20), "ANGLE");
        ccg.stand.imageFolderLabel = ccg.stand.add("statictext", wsFunc.xywh(15, 150, 300, 20), "立絵ﾌｫﾙﾀﾞ");
        ccg.stand.imageFolder = ccg.stand.add("edittext", wsFunc.xywh(20, 170, 110, 20), "FOLDER");
        ccg.stand.imageFolderButton = ccg.stand.add("button", wsFunc.xywh(133, 170, 50, 20), "参照");
    }

    //初期データの読み取り
    config.reload = function () {
        for (var i = 0; i < 6; i++) {
            var ccg = config.charGroup[i];
            var soc = commonSettingObj.chars[i];

            ccg.enable.value = soc.general.enable;
            ccg.general.name.text = soc.general.name;
            ccg.general.memo.text = soc.general.memo;
            ccg.general.monitoringFolder.text = soc.general.monitoringFolder;

            ccg.subtitles.enable.value = soc.subtitles.enable;
            ccg.subtitles.color.text = soc.subtitles.color;
            ccg.subtitles.x.text = soc.subtitles.x;
            ccg.subtitles.y.text = soc.subtitles.y;
            ccg.subtitles.font.text = soc.subtitles.font;
            ccg.subtitles.sizel.text = soc.subtitles.size;

            ccg.stand.enable.value = soc.stand.enable;
            ccg.stand.mirror.value = soc.stand.mirror;
            ccg.stand.x.text = soc.stand.x;
            ccg.stand.y.text = soc.stand.y;
            ccg.stand.sizel.text = soc.stand.size;
            ccg.stand.angle.text = soc.stand.angle;
            ccg.stand.imageFolder.text = soc.stand.imageFolder;
        }
    }
    config.reload();

    //ロジック
    config.rewrite = function () {
        for (var i = 0; i < 6; i++) {
            var ccg = config.charGroup[i];
            var soc = commonSettingObj.chars[i];

            soc.general.enable = ccg.enable.value;
            soc.general.name = ccg.general.name.text;
            soc.general.memo = ccg.general.memo.text;
            soc.general.monitoringFolder = ccg.general.monitoringFolder.text;

            soc.subtitles.enable = ccg.subtitles.enable.value;
            soc.subtitles.color = ccg.subtitles.color.text;
            soc.subtitles.x = parseFloat(ccg.subtitles.x.text) ? parseFloat(ccg.subtitles.x.text) : soc.subtitles.x;
            soc.subtitles.y = parseFloat(ccg.subtitles.y.text) ? parseFloat(ccg.subtitles.y.text) : soc.subtitles.y;
            soc.subtitles.font = parseFloat(ccg.subtitles.font.text) ? parseFloat(ccg.subtitles.font.text) : soc.subtitles.font;
            soc.subtitles.size = parseFloat(ccg.subtitles.sizel.text) ? parseFloat(ccg.subtitles.sizel.text) : soc.subtitles.size;

            soc.stand.enable = ccg.stand.enable.value;
            soc.stand.mirror = ccg.stand.mirror.value;
            soc.stand.x = parseFloat(ccg.stand.x.text) ? parseFloat(ccg.stand.x.text) : soc.stand.x;
            soc.stand.y = parseFloat(ccg.stand.y.text) ? parseFloat(ccg.stand.y.text) : soc.stand.y;
            soc.stand.size = parseFloat(ccg.stand.sizel.text) ? parseFloat(ccg.stand.sizel.text) : soc.stand.size;
            soc.stand.angle = parseFloat(ccg.stand.angle.text) ? parseFloat(ccg.stand.angle.text) : soc.stand.angle;
            soc.stand.imageFolder = ccg.stand.imageFolder.text;
        }
        wsFunc.exportJsonFile(commonSettingObj,autoSavePath);
    }

    for (var i = 0; i < 6; i++) {
        var ccg = config.charGroup[i];
        var soc = commonSettingObj.chars[i];

        //フィールド
        ccg.enable.onClick = config.rewrite;
        ccg.general.name.onChange = config.rewrite;
        ccg.general.memo.onChange = config.rewrite;
        ccg.general.monitoringFolder.rewrite = config.rewrite;
        ccg.general.monitoringFolder.id = i;
        ccg.general.monitoringFolder.onChange = function () { oldList[this.id] = null; this.rewrite(); };
        ccg.subtitles.enable.onClick = config.rewrite;
        ccg.subtitles.color.onChange = config.rewrite;
        ccg.subtitles.x.onChange = config.rewrite;
        ccg.subtitles.y.onChange = config.rewrite;
        ccg.subtitles.font.onChange = config.rewrite;
        ccg.subtitles.sizel.onChange = config.rewrite;
        ccg.stand.enable.onClick = config.rewrite;
        ccg.stand.mirror.onClick = config.rewrite;
        ccg.stand.x.onChange = config.rewrite;
        ccg.stand.y.onChange = config.rewrite;
        ccg.stand.sizel.onChange = config.rewrite;
        ccg.stand.angle.onChange = config.rewrite;
        ccg.stand.imageFolder.onChange = config.rewrite;

        //ボタン
        ccg.testButton.id = i;
        ccg.testButton.onClick = function () {
            createLayer(programFolder+"/test.wav",this.id);
        }
        ccg.general.monitoringFolderButton.onClick = function () {
            var folderObj = wsFunc.openFolderRichDialog(programFolder + "/rd.exe", "");
            if (!folderObj) {
                //キャンセルされた
                return;
            }
            this.parent.monitoringFolder.text = decodeURI(folderObj.toString());
            this.parent.monitoringFolder.onChange();
        }
        ccg.stand.imageFolderButton.onClick = function () {
            var folderObj = wsFunc.openFolderRichDialog(programFolder + "/rd.exe", "");
            if (!folderObj) {
                //キャンセルされた
                return;
            }
            this.parent.imageFolder.text = decodeURI(folderObj.toString());
            this.parent.imageFolder.onChange();
        }

    }


    return config;

}


function createUIPreview(id) {


    //描画
    var preview = new Window("dialog", "実況動画支援立ち絵選択", wsFunc.xywh(200, 150, 1020, 680));
    preview.pageLabel = preview.add("statictext", wsFunc.xywh(30, 15, 100, 20), "Page.1");
    preview.statusLabel1 = preview.add("statictext", wsFunc.xywh(480, 0, 600, 20), "STATUS");
    preview.statusLabel2 = preview.add("statictext", wsFunc.xywh(480, 15, 600, 20), "STATUS");
    preview.statusLabel3 = preview.add("statictext", wsFunc.xywh(480, 30, 600, 20), "STATUS");

    preview.buttons = [];
    preview.pages = [];
    preview.cells = [];
    for (var i = 0; i < 10; i++) {
        preview.buttons[i] = preview.add("button", wsFunc.xywh(90 + 35 * i, 10, 30, 30), i+1);
        preview.pages[i] = preview.add("panel", wsFunc.xywh(10, 50, 1000, 600));
        preview.pages[i].visible = (i == 0);
    }
    
    for (var i = 0; i < 150; i++) {
        var ps = 200;
        preview.cells[i] = preview.pages[Math.floor(i / 15)].add("panel", wsFunc.xywh((i % 15 % 5) * ps, Math.floor((i % 15) / 5) * ps, ps, ps));
        preview.cells[i].label = preview.cells[i].add("statictext", wsFunc.xywh(0, 0, 40, 20), "#" + (i + 1));
        preview.cells[i].image = preview.cells[i].add("iconbutton",wsFunc.xywh(0,0,ps,ps));
    }

    //初期データの読み取り
    preview.reload = function (_id) {
        var data = commonSettingObj.chars[_id];
        preview.statusLabel1.text = "一般： " + data.general.name + "  (" + data.general.memo + ")    " + data.general.monitoringFolder;
        preview.statusLabel2.text = "字幕： " + data.subtitles.color + "    " + data.subtitles.x + "x" + data.subtitles.y + "    大" + data.subtitles.size + "pt    " + data.subtitles.font;
        preview.statusLabel3.text = "立絵： " + (data.stand.mirror ? "鏡    " : "    ") + data.stand.x + "x" + data.stand.y + "    大" + data.stand.size + "px    回" + data.stand.angle + "    透" + data.stand.trans + "    " + data.stand.imageFolder;

        var imageFileObjs = wsFunc.getFilesSafty(data.stand.imageFolder);
        wsFunc.sortFileObj(imageFileObjs);
        if (imageFileObjs) {
            for (var i = 0; i < imageFileObjs.length && i < 150; i++) {
                var thumbnailPath = wsFunc.imageFromCash200(imageFileObjs[i].fsName, programFolder + "/cash200Address.json");
                var thumbnailObj = new File(thumbnailPath);
                if(thumbnailObj){
                    preview.cells[i].image.icon = thumbnailObj;
                    preview.cells[i].image.resource = imageFileObjs[i].fsName;
                }
                imageFileObjs[i].close();
                
            }
        }
    }
    preview.reload(id);


    //ロジック
    for (var i = 0; i < 10; i++) {
        preview.buttons[i].onClick = function () {
            for (var j = 0; j < 10; j++) {
                this.parent.buttons[j].active = false;
                this.parent.pages[j].visible = false;
            }
            this.activ = true;
            this.parent.pages[parseInt(this.text) - 1].visible = true;
            this.parent.pageLabel.text = "Page." + this.text;
        }
    }

    for (var i = 0; i < 150; i++) {
        preview.cells[i].master = preview;
        preview.cells[i].image.onClick = function () {
            communicationPreviewDialog = this.resource;
            this.parent.parent.parent.close();
        }
    }

    preview.show();

    return preview;
}


function monitoring() {
    monitoringSign.text = monitoringSign.text == "■" ? "◆" : "■";

    for (var i = 0; 6 < 1; i++) {
        var ccg = commonSettingObj.chars[i].general;
        if (!ccg.enable||ccg.monitoringFolder == "" || ccg.monitoringFolder == "未指定") { continue; }

        var folObj = new Folder(ccg.monitoringFolder);
        var fileObjs = folObj.getFiles("*.wav");
        var filePathes = [];
        for (var j = 0; j < fileObjs.length; j++) {
            filePathes[j] = fileObjs[j].fsName;
        }


        //oldListがあるなら比較する
        if (!oldList[i]) {
            if (filePathes.length > 0) {
                alert("監視ディレクトリに初めからWAVAファイルがあります\nこれらはスキップされました\n" + filePathes.join("\n"));
            }
            oldList[i] = [];
            writeLn("監視フォルダの更新");
        } else {
            var deff = wsFunc.setDiff(filePathes, oldList[i]);
            if (deff.length == 1) {
                createLayer(deff[0], i);
            } else if (deff.length > 1) {
                alert("複数更新を検知しました\n検知されたファイルは反映されていませんので確認してください");
            }
        }
        //oldListを更新する
        oldList[i] = filePathes;

    }

}


function createLayer(voicePath, id) {
    var cc = commonSettingObj.chars[id];

    //コンポジション情報
    var targetComp = app.project.activeItem;
    if (!(targetComp instanceof CompItem)) {
        alert("選択されているタイムラインに追加できません\n追加可能なコンポジションであることを\n確認してください");
        return;
    }
    var nowTime = targetComp.time;

    var compW = targetComp.width;
    var compH = targetComp.height;

    //音声の保存の時間稼ぎに
    if (cc.stand.enable) {
        communicationPreviewDialog = null;
        previewDialog = createUIPreview(id);
    }

    //音声
    var fileObj = new File(voicePath);
    if (!fileObj) {
        alert("音声の読み込みに失敗");
        return;
    }
    var audio = app.project.importFile(new ImportOptions(fileObj));
    var duration = audio.duration;
    var audioLayer = targetComp.layers.add(audio);
    audioLayer.startTime = nowTime;

    //立ち絵
    
    if (cc.stand.enable) {
        var standPath = communicationPreviewDialog;
        if (standPath) {
            var standFileObj = new File(standPath);
            //例外OK
            if (standFileObj) {
                var stand = app.project.importFile(new ImportOptions(standFileObj));
                var standLayer = targetComp.layers.add(stand);

                standLayer.startTime = nowTime;
                standLayer.outPoint = nowTime + duration;
                standLayer("position").setValue([compW * cc.stand.x, compH * cc.stand.y]);
                var srcW = stand.width;
                var srcH = stand.height;
                var scale = (srcW > srcH ? cc.stand.size / srcW * 100 : cc.stand.size / srcH * 100);
                standLayer("scale").setValue([(cc.stand.mirror ? -1 : 1) * scale, scale]);
                standLayer("rotation").setValue(cc.stand.angle * 360);
                standLayer("Opacity").expression = "transform.opacity = easeIn(time, inPoint, inPoint + 0.10, 0, 100) * ease(time, outPoint - 0.15, outPoint, 100, 0) / 100;";
            } else { alert("立ち絵ファイルが開けません"); }
        }
    }
    

    //字幕
    if (cc.subtitles.enable) {
        var text = "";
        var textFileObj = new File(voicePath.replace(/\.wav$/, ".txt"));
        if (textFileObj && textFileObj.open("r")) {
            text = textFileObj.read();
            textFileObj.close();
        } else {
            alert("テキストが開けません\n代わりにファイルネームを使用します");
            text = textFileObj.name.replace(/\.wav$/, "");
        }
        var textLayer = targetComp.layers.addBoxText([compW * 0.8, compH * 0.3], text);
        textLayer.startTime = nowTime;
        textLayer.outPoint = nowTime + duration
        var textCfg = textLayer.property("Source Text").value;

        //textCfg.resetCharStyle();
        textCfg.fontSize = compH / 720 * cc.subtitles.size;
        var baseColor = wsFunc.colorNumCode(cc.subtitles.color);
        var baseColorHLS = wsFunc.toHLS(baseColor);
        textCfg.fillColor = wsFunc.toRGB(baseColorHLS[0], 1 - (1 - baseColorHLS[1]) * 0.4, baseColorHLS[2]);
        textCfg.strokeColor = wsFunc.toRGB(baseColorHLS[0], baseColorHLS[1] * 0.6, baseColorHLS[2]);
        //textCfg.strokeWidth = 2;
        textCfg.font = cc.subtitles.font;
        //textCfg.strokeOverFill = true;
        //textCfg.applyStroke = true;
        //textCfg.applyFill = true;
        //textCfg.fauxBold = true;
        //textCfg.text = text;
        textCfg.justification = ParagraphJustification.CENTER_JUSTIFY;
        //textCfg.tracking = 50;
        textLayer.property("Source Text").setValue(textCfg);

        textLayer("anchorPoint").setValue([0, compH / 8]);
        textLayer("position").setValue([compW * cc.subtitles.x,compH* cc.subtitles.y]);
        textLayer("Opacity").expression = "transform.opacity = easeIn(time, inPoint, inPoint + 0.10, 0, 100) * ease(time, outPoint - 0.15, outPoint, 100, 0) / 100;";
    }
}

