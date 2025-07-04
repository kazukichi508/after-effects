(function(thisObj) {
    // --- グローバルなヘルパー関数 ---
    function execute(undoName, operation) {
        try { app.beginUndoGroup(undoName); operation(); } catch (e) { alert("スクリプトエラー (" + undoName + "):\n" + e.toString(), "エラー"); } finally { app.endUndoGroup(); }
    }
    function getActiveCompAndLayers(minSelection) {
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) { alert("コンポジションをアクティブにしてください。"); return null; }
        var layers = comp.selectedLayers;
        if (layers.length < minSelection) { alert("少なくとも" + minSelection + "個のレイヤーを選択してください。"); return null; }
        var layerArray = [];
        for (var i = 0; i < layers.length; i++) { layerArray.push(layers[i]); }
        layerArray.sort(function(a, b) { return a.index - b.index; });
        return { comp: comp, layers: layerArray };
    }

    // --- UIの構築 ---
    var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "総合操作パネル v3.40", undefined, {dockable:true});
    if (myPanel === null) return;

    myPanel.orientation = "column"; 
    myPanel.alignChildren = ["fill", "top"]; 
    myPanel.spacing = 5; 
    myPanel.margins = 10;

    var tabbedPanel = myPanel.add('tabbedpanel');
    tabbedPanel.alignChildren = 'fill';
    tabbedPanel.preferredSize = [300, 450];

    // --- タブ1: タイムライン操作 ---
    var timelineTab = tabbedPanel.add('tab', undefined, 'タイムライン');
    timelineTab.orientation = "column"; 
    timelineTab.alignChildren = "fill"; 
    timelineTab.spacing = 10; 
    timelineTab.margins = 10;

    var timelinePanel1 = timelineTab.add("panel", undefined, "レイヤーの開始時間を0秒へ:");
    timelinePanel1.alignChildren = "fill";
    var moveByNameGroup = timelinePanel1.add("group");
    moveByNameGroup.orientation = "row";
    moveByNameGroup.alignChildren = ["left", "center"];
    var layerNameInput = moveByNameGroup.add("edittext", undefined, "背景*");
    layerNameInput.helpTip = "ワイルドカード * 使用可";
    layerNameInput.preferredSize.width = 120;
    layerNameInput.addEventListener('focus', function(){ if(this.text === '背景*') this.text = ''; });
    layerNameInput.addEventListener('blur', function(){ if(this.text.replace(/\s/g, '') === '') this.text = '背景*'; });
    var moveSpecificButton = moveByNameGroup.add("button", undefined, "指定名");
    var moveButtonsGroup = timelinePanel1.add("group");
    moveButtonsGroup.orientation = "row";
    var moveSelectedButton = moveButtonsGroup.add("button", undefined, "選択");
    moveSelectedButton.preferredSize.width = 100;
    var moveAllButton = moveButtonsGroup.add("button", undefined, "全て");
    moveAllButton.preferredSize.width = 100;
    
    var timelinePanel2 = timelineTab.add("panel", undefined, "フレーム操作:");
    timelinePanel2.alignChildren = "fill";
    timelinePanel2.add("statictext", undefined, "配置/間隔フレーム数:");
    var frameInputControls = timelinePanel2.add("group");
    frameInputControls.orientation = "row";
    frameInputControls.alignChildren = ["left", "center"];
    var minusButton = frameInputControls.add("button", undefined, "-");
    minusButton.preferredSize = [30, 25];
    var frameShiftInput = frameInputControls.add("edittext", undefined, "1");
    frameShiftInput.preferredSize = [40, 25];
    var plusButton = frameInputControls.add("button", undefined, "+");
    plusButton.preferredSize = [30, 25];
    frameInputControls.add("statictext", undefined, "フレーム");
    
    timelinePanel2.add("statictext", undefined, "選択レイヤーを移動:");
    var moveLayersGroup = timelinePanel2.add("group");
    moveLayersGroup.orientation = "row";
    moveLayersGroup.alignChildren = ["left", "center"];
    var moveLeftButton = moveLayersGroup.add("button", undefined, "◀");
    moveLeftButton.preferredSize = [50, 25];
    moveLeftButton.helpTip = "選択したレイヤーを入力フレーム数分、前に移動します。";
    var moveFramesInput = moveLayersGroup.add("edittext", undefined, "1");
    moveFramesInput.preferredSize = [40, 25];
    var moveRightButton = moveLayersGroup.add("button", undefined, "▶");
    moveRightButton.preferredSize = [50, 25];
    moveRightButton.helpTip = "選択したレイヤーを入力フレーム数分、後に移動します。";
    moveLayersGroup.add("statictext", undefined, "フレーム");

    var timelinePanel3 = timelineTab.add("panel", undefined, "階段状/間隔/順序:");
    timelinePanel3.alignChildren = "fill";
    var shiftOrderButtons = timelinePanel3.add("group");
    shiftOrderButtons.orientation = "column";
    shiftOrderButtons.alignChildren = "fill";
    shiftOrderButtons.spacing = 5;
    var row1 = shiftOrderButtons.add("group");
    row1.orientation = "row";
    var staggerButton = row1.add("button", undefined, "階段状に配置");
    staggerButton.helpTip = "一番下のレイヤーを基準に配置。正の値で上のレイヤーが右（後）にずれます。";
    staggerButton.preferredSize.width = 100;
    var reverseOrderButton = row1.add("button", undefined, "順序を反転");
    reverseOrderButton.preferredSize.width = 100;
    var increaseStaggerButton = shiftOrderButtons.add("button", undefined, "間隔を追加/削除");
    increaseStaggerButton.helpTip = "選択レイヤーの間隔を、一番下のレイヤーを基準に調整します。";


    // --- タブ2: レイヤー調整 ---
    var layerAdjustTab = tabbedPanel.add('tab', undefined, 'レイヤー調整');
    layerAdjustTab.orientation = "column"; 
    layerAdjustTab.alignChildren = "fill"; 
    layerAdjustTab.spacing = 10; 
    layerAdjustTab.margins = 10;
    
    var scalePanel = layerAdjustTab.add("panel", undefined, "スケール調整:");
    scalePanel.alignChildren = "fill";
    var fitButtons = scalePanel.add("group");
    fitButtons.orientation = "row";
    var fitToCompWidthButton = fitButtons.add("button", undefined, "幅フィット");
    fitToCompWidthButton.preferredSize.width = 100;
    var fitToCompHeightButton = fitButtons.add("button", undefined, "高さフィット");
    fitToCompHeightButton.preferredSize.width = 100;
    var matchScaleButton = scalePanel.add("button", undefined, "一番上のレイヤーに合わせる");

    var positionPanel = layerAdjustTab.add("panel", undefined, "ポジションと配置:");
    positionPanel.alignChildren = "fill";
    var swapPositionButton = positionPanel.add("button", undefined, "ポジションを入れ替え");
    swapPositionButton.alignment = "center";
    var distributeButton = positionPanel.add("button", undefined, "均等配置");
    distributeButton.alignment = "center";
    var aspectLockCheckbox = positionPanel.add("checkbox", undefined, "均等配置で比率を維持");
    aspectLockCheckbox.value = true;
    aspectLockCheckbox.alignment = "center";
    var restoreAspectButton = positionPanel.add("button", undefined, "元の比率に復元");
    restoreAspectButton.alignment = "center";

    var createPanel = layerAdjustTab.add("panel", undefined, "オブジェクト作成 (連番):");
    createPanel.alignChildren = "fill";
    var nameInputsGroup = createPanel.add("group");
    nameInputsGroup.orientation = "row";
    nameInputsGroup.alignment = "center";
    nameInputsGroup.spacing = 5;
    nameInputsGroup.add("statictext", undefined, "平面名:");
    var solidNameInput = nameInputsGroup.add("edittext", undefined, "平面");
    solidNameInput.preferredSize.width = 60;
    solidNameInput.addEventListener('focus', function(){ if(this.text === '平面') this.text = ''; });
    solidNameInput.addEventListener('blur', function(){ if(this.text.replace(/\s/g, '') === '') this.text = '平面'; });
    nameInputsGroup.add("statictext", undefined, "ヌル名:");
    var nullNameInput = nameInputsGroup.add("edittext", undefined, "ヌル");
    nullNameInput.preferredSize.width = 60;
    nullNameInput.addEventListener('focus', function(){ if(this.text === 'ヌル') this.text = ''; });
    nullNameInput.addEventListener('blur', function(){ if(this.text.replace(/\s/g, '') === '') this.text = 'ヌル'; });
    var creationButtonsGroup = createPanel.add("group");
    creationButtonsGroup.orientation = "row";
    creationButtonsGroup.alignment = "center";
    var createWhiteSolidButton = creationButtonsGroup.add("button", undefined, "白平面");
    var createBlackSolidButton = creationButtonsGroup.add("button", undefined, "黒平面");
    var createGraySolidButton = creationButtonsGroup.add("button", undefined, "灰平面");
    var createNullButton = creationButtonsGroup.add("button", undefined, "ヌル");

    // --- タブ3: リネーム ---
    var renameTab = tabbedPanel.add('tab', undefined, 'リネーム');
    renameTab.orientation = "column";
    renameTab.alignChildren = "fill";
    renameTab.spacing = 10;
    renameTab.margins = 10;

    var renamePanel = renameTab.add("panel", undefined, "レイヤーとソースのリネーム:");
    renamePanel.alignChildren = "fill";
    var renameGroup = renamePanel.add("group");
    renameGroup.orientation = "row";
    renameGroup.alignChildren = ["left", "center"];
    var renameInput = renameGroup.add("edittext", undefined, "新しい名前");
    renameInput.preferredSize.width = 120;
    renameInput.addEventListener('focus', function(){ if(this.text === '新しい名前') this.text = ''; });
    renameInput.addEventListener('blur', function(){ if(this.text.replace(/\s/g, '') === '') this.text = '新しい名前'; });
    var renameButton = renameGroup.add("button", undefined, "リネーム");

    // --- タブ4: プロジェクト管理 ---
    var projectTab = tabbedPanel.add('tab', undefined, 'プロジェクト');
    projectTab.orientation = "column"; 
    projectTab.alignChildren = "fill"; 
    projectTab.spacing = 10; 
    projectTab.margins = 10;

    var projectPanel = projectTab.add("panel", undefined, "プロジェクト管理");
    projectPanel.alignChildren = "fill";
    projectPanel.spacing = 10;
    var organizeCompsButton = projectPanel.add("button", undefined, "全コンポをITEMフォルダへ");
    organizeCompsButton.helpTip = "プロジェクト内の全てのコンポジションを「ITEM」という名前のフォルダにまとめます。";
    var organizeHierarchicallyButton = projectPanel.add("button", undefined, "プロジェクトを階層的に整理");
    organizeHierarchicallyButton.helpTip = "プロジェクト内のコンポジションを、親子関係に基づいたフォルダ構造に整理します。";
    var deleteUnusedButton = projectPanel.add("button", undefined, "未使用フッテージを削除");
    deleteUnusedButton.helpTip = "【注意】この操作は元に戻せません！";

    // [変更] ボタンをタブパネルの外に移動
    var purgeCacheButton = myPanel.add("button", undefined, "全キャッシュを削除");
    purgeCacheButton.helpTip = "すべてのメモリとディスクキャッシュを削除します。";
    purgeCacheButton.alignment = "center";

    // 閉じるボタン
    var closeButton = myPanel.add("button", undefined, "閉じる");
    closeButton.alignment = "center";

    // --- ボタン処理のロジック ---

    // タイムライン操作
    moveSpecificButton.onClick = function() { execute("指定名のレイヤーを0秒へ", function() { var c=app.project.activeItem; if(!c||!(c instanceof CompItem))return alert("コンポジションをアクティブにしてください。"); var p=(layerNameInput.text==="背景*")?"":layerNameInput.text; if(!p)return alert("移動したいレイヤー名を入力してください。"); var r=new RegExp("^"+p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\\\*/g,".*")+"$"); var f=false; for(var i=1;i<=c.numLayers;i++){if(r.test(c.layer(i).name)){c.layer(i).startTime=0;f=true;}} if(!f)alert("指定パターンに一致するレイヤーは見つかりませんでした。");});};
    moveSelectedButton.onClick = function() { execute("選択レイヤーを0秒へ", function() { var d=getActiveCompAndLayers(1); if(d)for(var i=0;i<d.layers.length;i++)d.layers[i].startTime=0;});};
    moveAllButton.onClick = function() { execute("全レイヤーを0秒へ", function() { var c=app.project.activeItem; if(c&&c instanceof CompItem)for(var i=1;i<=c.numLayers;i++)c.layer(i).startTime=0;});};
    minusButton.onClick = function() { var v=parseFloat(frameShiftInput.text); frameShiftInput.text=(isNaN(v)?-1:v-1).toString();};
    plusButton.onClick = function() { var v=parseFloat(frameShiftInput.text); frameShiftInput.text=(isNaN(v)?1:v+1).toString();};
    
    function moveLayersByFrames(direction) {
        execute(direction > 0 ? "フレーム後に移動" : "フレーム前に移動", function() {
            var d = getActiveCompAndLayers(1);
            if (!d) return;
            var f = parseFloat(moveFramesInput.text);
            if (isNaN(f)) { 
                alert("有効なフレーム数を入力してください。");
                return;
            }
            var timeToShift = (f / d.comp.frameRate) * direction;
            for (var i = 0; i < d.layers.length; i++) {
                d.layers[i].startTime += timeToShift;
            }
        });
    }
    moveLeftButton.onClick = function() { moveLayersByFrames(-1); };
    moveRightButton.onClick = function() { moveLayersByFrames(1); };

    staggerButton.onClick = function() {
        execute("階段状に配置", function() {
            var d = getActiveCompAndLayers(2);
            if (!d) return;
            var f = parseFloat(frameShiftInput.text);
            if (isNaN(f)) { alert("有効なフレーム数を入力してください。"); return; }
            var t = f / d.comp.frameRate;
            var lastIndex = d.layers.length - 1;
            var baseTime = d.layers[lastIndex].startTime; 
            
            for (var i = 0; i <= lastIndex; i++) {
                d.layers[i].startTime = baseTime + ((lastIndex - i) * t);
            }
        });
    };
    
    increaseStaggerButton.onClick = function() {
        execute("間隔を追加/削除", function() {
            var d = getActiveCompAndLayers(2);
            if (!d) return;
            var a = parseFloat(frameShiftInput.text);
            if (isNaN(a)) { alert("有効なフレーム数を入力してください。"); return; }
            
            var delta_t = a / d.comp.frameRate;
            var lastIndex = d.layers.length - 1;

            var current_interval = d.layers[lastIndex - 1].startTime - d.layers[lastIndex].startTime;
            var new_interval = current_interval + delta_t;

            var baseTime = d.layers[lastIndex].startTime;
            
            for (var i = 0; i < lastIndex; i++) {
                d.layers[i].startTime = baseTime + ((lastIndex - i) * new_interval);
            }
        });
    };
    reverseOrderButton.onClick = function() { execute("順序を反転", function() { var d=getActiveCompAndLayers(2); if(!d)return; var f=d.layers[0]; for(var i=d.layers.length-1;i>=1;i--)d.layers[i].moveBefore(f);});};

    // レイヤー調整
    var ASPECT_MARKER_COMMENT = "Original Aspect Ratio by Script";
    function saveOriginalScaleToMarker(layer) { var scaleProp = layer.property("Scale"); if (!scaleProp) return; var markerProp = layer.property("Marker"); var scaleValueStr = scaleProp.value.toString(); for (var i = markerProp.numKeys; i >= 1; i--) { if (markerProp.keyValue(i).comment === ASPECT_MARKER_COMMENT) markerProp.removeKey(i); } var newMarker = new MarkerValue(ASPECT_MARKER_COMMENT); newMarker.chapter = scaleValueStr; markerProp.setValueAtTime(layer.inPoint > 0 ? layer.inPoint : 0, newMarker); }
    matchScaleButton.onClick = function() { execute("スケールを合わせる", function() { var d=getActiveCompAndLayers(2); if(!d)return; var b=d.layers[0].property("Scale").value; for(var i=1;i<d.layers.length;i++)if(d.layers[i].property("Scale"))d.layers[i].property("Scale").setValue(b);});};
    restoreAspectButton.onClick = function() { execute("比率を復元", function() { var data = getActiveCompAndLayers(1); if (!data) return; var restoredCount = 0; for (var i = 0; i < data.layers.length; i++) { var layer = data.layers[i]; var scaleProp = layer.property("Scale"), markerProp = layer.property("Marker"); if (!scaleProp || !markerProp) continue; for (var j = markerProp.numKeys; j >= 1; j--) { var marker = markerProp.keyValue(j); if (marker.comment === ASPECT_MARKER_COMMENT && marker.chapter !== "") { var scaleStrings = marker.chapter.split(','); if (scaleStrings.length >= 2) { var scaleValues = []; for(var k=0; k < scaleStrings.length; k++) scaleValues.push(parseFloat(scaleStrings[k])); if (scaleProp.value.length === scaleValues.length) { scaleProp.setValue(scaleValues); markerProp.removeKey(j); restoredCount++; break; } } } } } if (restoredCount > 0) alert(restoredCount + " 個のレイヤーの比率を復元しました。"); else alert("選択レイヤーに復元可能な比率の情報がありません。"); }); };
    fitToCompWidthButton.onClick = function() { execute("幅フィット", function() { var d=getActiveCompAndLayers(1); if(!d)return; for(var i=0;i<d.layers.length;i++){var l=d.layers[i];var s=l.property("Scale");if(!s)continue;try{var r=l.sourceRectAtTime(d.comp.time,false);}catch(e){continue;}if(r.width<=0)continue;var f=l.parent?l.parent.property("Scale").value[0]/100:1;var n=(d.comp.width/r.width)*100/f;s.setValue([n,n,n]);}});};
    fitToCompHeightButton.onClick = function() { execute("高さフィット", function() { var d=getActiveCompAndLayers(1); if(!d)return; for(var i=0;i<d.layers.length;i++){var l=d.layers[i];var s=l.property("Scale");if(!s)continue;try{var r=l.sourceRectAtTime(d.comp.time,false);}catch(e){continue;}if(r.height<=0)continue;var f=l.parent?l.parent.property("Scale").value[1]/100:1;var n=(d.comp.height/r.height)*100/f;s.setValue([n,n,n]);}});};
    swapPositionButton.onClick=function(){execute("ポジションを入れ替え",function(){var d=getActiveCompAndLayers(2);if(!d)return;if(d.layers.length!==2)return alert("ポジションを入れ替えるには、ちょうど2つのレイヤーを選択してください。");var a=d.layers[0],b=d.layers[1];var p=a.property("Position"),q=b.property("Position");if(!p||!q)return;var t=p.value;p.setValue(q.value);q.setValue(t);});};
    
    distributeButton.onClick = function() {
        execute("均等配置 (位置参照)", function() {
            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) {
                alert("コンポジションをアクティブにしてください。");
                return;
            }
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length < 1) {
                alert("少なくとも1個のレイヤーを選択してください。");
                return;
            }

            var layers = [];
            for (var i = 0; i < selectedLayers.length; i++) {
                layers.push(selectedLayers[i]);
            }

            layers.sort(function(a, b) {
                var posA = a.property("Position").value;
                var posB = b.property("Position").value;
                if (posA[1] !== posB[1]) {
                    return posA[1] - posB[1];
                }
                return posA[0] - posB[0];
            });

            var n = layers.length;
            var c = Math.ceil(Math.sqrt(n));
            var r = Math.ceil(n / c);
            if (n === 1) { c = 1; r = 1; }

            var w = comp.width / c;
            var h = comp.height / r;

            for (var i = 0; i < n; i++) {
                var layer = layers[i];
                var posProp = layer.property("Position");
                if (!posProp) continue;

                var gridRow = Math.floor(i / c);
                var gridCol = i % c;
                var newPos = [(gridCol + 0.5) * w, (gridRow + 0.5) * h];

                posProp.setValue(layer.parent ? layer.parent.fromWorld(newPos) : newPos);

                if (!aspectLockCheckbox.value) {
                    saveOriginalScaleToMarker(layer);
                    var scaleProp = layer.property("Scale");
                    if (!scaleProp) continue;
                    try {
                        var sourceRect = layer.sourceRectAtTime(comp.time, false);
                    } catch (e) {
                        continue;
                    }
                    if (sourceRect.width <= 0 || sourceRect.height <= 0) continue;
                    
                    var parentScaleX = 1, parentScaleY = 1;
                    if (layer.parent) {
                        var parentScale = layer.parent.property("Scale").value;
                        parentScaleX = parentScale[0] / 100;
                        parentScaleY = parentScale[1] / 100;
                    }
                    
                    var newScaleX = (w / sourceRect.width) * 100 / parentScaleX;
                    var newScaleY = (h / sourceRect.height) * 100 / parentScaleY;
                    
                    scaleProp.setValue([newScaleX, newScaleY, scaleProp.value.length > 2 ? scaleProp.value[2] : 0]);
                }
            }
        });
    };
    
    renameButton.onClick = function() {
        execute("レイヤーとソースをリネーム", function() {
            var d = getActiveCompAndLayers(1);
            if (!d) return;

            var baseName = renameInput.text;
            if (baseName === "" || baseName === "新しい名前") {
                alert("新しいレイヤー名を入力してください。");
                return;
            }

            var allLayerNames = {};
            for (var j = 1; j <= d.comp.numLayers; j++) {
                allLayerNames[d.comp.layer(j).name] = true;
            }

            var allProjectItemNames = {};
            for (var j = 1; j <= app.project.numItems; j++) {
                allProjectItemNames[app.project.item(j).name] = true;
            }

            var renamedSourceIds = {};

            for (var i = 0; i < d.layers.length; i++) {
                var layer = d.layers[i];
                var source = layer.source;
                var hasProjectSource = (source instanceof CompItem || source instanceof FootageItem);
                
                var currentName = (d.layers.length === 1) ? baseName : baseName + " " + (i + 1);
                var finalName = currentName;
                var number = 2;

                while (allLayerNames[finalName] || (hasProjectSource && allProjectItemNames[finalName])) {
                    finalName = currentName + " " + number;
                    number++;
                }

                layer.name = finalName;
                allLayerNames[finalName] = true;

                if (hasProjectSource && !renamedSourceIds[source.id]) {
                    source.name = finalName;
                    allProjectItemNames[finalName] = true;
                    renamedSourceIds[source.id] = true;
                }
            }
        });
    };

    function createSolid(color, baseName) {
        execute("平面を作成", function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("コンポジションをアクティブにしてください。");
                return;
            }
            if (baseName === "") {
                alert("平面名の基本部分を入力してください。");
                return;
            }
            var number = 1;
            var finalName;
            while (true) {
                finalName = baseName + " " + number;
                var nameExists = false;
                for (var i = 1; i <= comp.numLayers; i++) {
                    if (comp.layer(i).name === finalName) {
                        nameExists = true;
                        break;
                    }
                }
                if (!nameExists) { break; }
                number++;
            }
            comp.layers.addSolid(color, finalName, comp.width, comp.height, comp.pixelAspect, comp.duration).moveToBeginning();
        });
    }
    createWhiteSolidButton.onClick = function() { createSolid([1, 1, 1], solidNameInput.text); };
    createBlackSolidButton.onClick = function() { createSolid([0, 0, 0], solidNameInput.text); };
    createGraySolidButton.onClick = function() { createSolid([0.5, 0.5, 0.5], solidNameInput.text); };

    function createNull(baseName) {
        execute("ヌルを作成", function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("コンポジションをアクティブにしてください。");
                return;
            }
            if (baseName === "") {
                alert("ヌル名の基本部分を入力してください。");
                return;
            }
            var number = 1;
            var finalName;
            while (true) {
                finalName = baseName + " " + number;
                var nameExists = false;
                for (var i = 1; i <= comp.numLayers; i++) {
                    if (comp.layer(i).name === finalName) {
                        nameExists = true;
                        break;
                    }
                }
                if (!nameExists) { break; }
                number++;
            }
            var nullLayer = comp.layers.addNull(comp.duration);
            nullLayer.name = finalName;
            nullLayer.moveToBeginning();
        });
    }
    createNullButton.onClick = function() { createNull(nullNameInput.text); };


    // プロジェクト管理
    organizeCompsButton.onClick = function() {
        execute("全コンポをITEMフォルダへ", function() {
            var project = app.project;
            if (project.numItems === 0) {
                alert("プロジェクトにアイテムがありません。");
                return;
            }

            var targetFolderName = "ITEM";
            var targetFolder = null;

            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof FolderItem && item.name === targetFolderName) {
                    targetFolder = item;
                    break;
                }
            }
            if (targetFolder === null) {
                targetFolder = project.items.addFolder(targetFolderName);
            }

            var compsToMove = [];
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof CompItem && item.parentFolder !== targetFolder) {
                    compsToMove.push(item);
                }
            }

            for (var i = 0; i < compsToMove.length; i++) {
                compsToMove[i].parentFolder = targetFolder;
            }

            if (compsToMove.length > 0) {
                alert(compsToMove.length + "個のコンポジションを「" + targetFolderName + "」フォルダに移動しました。");
            } else {
                alert("移動対象のコンポジションはありませんでした。");
            }
        });
    };
    
    organizeHierarchicallyButton.onClick = function() {
        execute("プロジェクトを階層的に整理", function() {
            var project = app.project;
            if (project.numItems === 0) {
                alert("プロジェクトにアイテムがありません。");
                return;
            }

            var mainFolderName = "Organized Project";
            var mainFolder = null;
            for (var i = 1; i <= project.numItems; i++) {
                if (project.item(i) instanceof FolderItem && project.item(i).name === mainFolderName) {
                    mainFolder = project.item(i);
                    break;
                }
            }
            if (mainFolder === null) {
                mainFolder = project.items.addFolder(mainFolderName);
            }

            var allComps = [];
            var compUsage = {};
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof CompItem) {
                    allComps.push(item);
                    if (compUsage[item.id] === undefined) {
                        compUsage[item.id] = 0;
                    }
                    for (var j = 1; j <= item.numLayers; j++) {
                        var source = item.layer(j).source;
                        if (source && source instanceof CompItem) {
                            if (compUsage[source.id] === undefined) {
                                compUsage[source.id] = 1;
                            } else {
                                compUsage[source.id]++;
                            }
                        }
                    }
                }
            }

            var rootComps = [];
            for (var i = 0; i < allComps.length; i++) {
                if (compUsage[allComps[i].id] === 0) {
                    rootComps.push(allComps[i]);
                }
            }

            if (rootComps.length === 0 && allComps.length > 0) {
                rootComps.push(allComps[0]);
            }
            
            var processedItems = {};

            function organizeComp(comp, parentFolder) {
                if (processedItems[comp.id]) {
                    return; 
                }
                
                var compFolder = parentFolder.items.addFolder(comp.name);
                comp.parentFolder = compFolder;
                processedItems[comp.id] = true;

                for (var i = 1; i <= comp.numLayers; i++) {
                    var layer = comp.layer(i);
                    var source = layer.source;

                    if (source && !processedItems[source.id]) {
                        if (source instanceof CompItem) {
                            organizeComp(source, compFolder);
                        } else if (source instanceof FootageItem) {
                            source.parentFolder = compFolder;
                            processedItems[source.id] = true;
                        }
                    }
                }
            }

            for (var i = 0; i < rootComps.length; i++) {
                organizeComp(rootComps[i], mainFolder);
            }

            alert("プロジェクトの階層的な整理が完了しました。");
        });
    };

    deleteUnusedButton.onClick=function(){execute("未使用フッテージを削除",function(){var p=app.project;if(p.numItems===0)return alert("プロジェクトにアイテムがありません。");if(!confirm("プロジェクトから未使用のフッテージを完全に削除します。\n※コンポジションは削除されません。\n\nこの操作は元に戻せません。本当によろしいですか？"))return;var t=0,r;do{r=0;for(var i=p.numItems;i>=1;i--){var c=p.item(i);if(c instanceof FolderItem||(c.name==="Solids"&&c.typeName==="Folder"))continue;if(c instanceof FootageItem&&c.usedIn.length===0){c.remove();r++;}}t+=r;}while(r>0);if(t>0)alert(t+"個の未使用フッテージを削除しました。");else alert("削除対象の未使用フッテージは見つかりませんでした。");});};
    
    purgeCacheButton.onClick = function() {
        if (confirm("すべてのメモリとディスクキャッシュを削除します。\nこの操作は時間がかかる場合があります。よろしいですか？")) {
            execute("全キャッシュを削除", function() {
                app.purge(PurgeTarget.ALL_CACHES);
                alert("すべてのキャッシュを削除しました。");
            });
        }
    };

    // 閉じるボタン
    closeButton.onClick = function() { myPanel.close(); };

    // --- ウィンドウ表示 ---
    myPanel.layout.layout(true);
    myPanel.onResizing = myPanel.onResize = function() {
        if (this.layout) {
            this.layout.resize();
        }
    }

    if (myPanel instanceof Window) {
        myPanel.center();
        myPanel.show();
    }
})(this);
