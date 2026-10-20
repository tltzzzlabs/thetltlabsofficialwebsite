(function () {
    var form = document.getElementById("search-form");
    var input = document.getElementById("address-input");
    var btn = document.getElementById("search-btn");
    var resetBtn = document.getElementById("reset-btn");
    var ruleBtn = document.getElementById("rule-btn");
    var infoPanel = document.getElementById("info-panel");
    var poiPanel = document.getElementById("poi-panel");
    var loading = document.getElementById("loading");

    var map = null;
    var mapOverlays = [];
    var mapMarkers = [];
    var hasResult = false;
    var requestId = 0;
    var currentResult = null;

    var SHANGHAI_CENTER = { lat: 31.2304, lng: 121.4737 };
    var DEFAULT_ZOOM = 18;
    var DEFAULT_TILT = 50;

    var mapErrorEl = document.getElementById("map-error");
    var mapErrorDetail = document.getElementById("map-error-detail");

    function showMapError(msg) {
        mapErrorDetail.textContent = msg;
        mapErrorEl.style.display = "flex";
    }

    var baiduMapLoaded = false;
    var baiduMapTimer = setTimeout(function () {
        if (!baiduMapLoaded) {
            showMapError("百度地图 SDK 加载超时，请检查网络连接或 AK 配置（当前 AK: " + (window.BAIDU_AK || "未设置") + "）");
        }
    }, 10000);

    function initMap(center) {
        try {
            map = new BMapGL.Map("bmap", {
                displayOptions: {
                    building: true,
                    skyColors: ["#e8f4fd", "#b8dff5"],
                },
            });
            var point = new BMapGL.Point(center.lng, center.lat);
            map.centerAndZoom(point, DEFAULT_ZOOM);
            map.enableScrollWheelZoom(true);
            map.setTilt(DEFAULT_TILT);
            map.setHeading(0);
        } catch (e) {
            showMapError("地图初始化失败: " + e.message);
        }
    }

    window.initBaiduMap = function () {
        baiduMapLoaded = true;
        clearTimeout(baiduMapTimer);
        initMap(SHANGHAI_CENTER);
        restoreMapState();
    };

    function restoreMapState() {
        var savedState = localStorage.getItem("map_state");
        if (!savedState) return;
        try {
            var data = JSON.parse(savedState);
            localStorage.removeItem("map_state");
            data.center = json.load(localStorage.getItem("map_center"));
            showResult(data);
        } catch (e) {
            console.warn("Failed to restore map state:", e);
        }
    }

    var CATEGORY_COLORS = {
        medical: "#f5222d",
        education: "#fa8c16",
        commercial: "#52c41a",
        elderly_care: "#eb2f96",
        transport: "#1890ff",
        government: "#722ed1",
        community: "#13c2c2",
        financial: "#faad14",
        recreation: "#2f54eb",
    };

    var LEVEL_COLORS = {
        "优秀": "#52c41a", "良好": "#1890ff", "一般": "#faad14",
        "较差": "#fa8c16", "严重不足": "#f5222d",
    };

    var allPois = [];
    var poiLabels = [];
    var filterEl = document.getElementById("poi-filter");

    filterEl.addEventListener("click", function (e) {
        var btn = e.target.closest(".poi-filter-btn");
        if (!btn) return;
        filterEl.querySelectorAll(".poi-filter-btn").forEach(function (b) {
            b.classList.remove("active");
        });
        btn.classList.add("active");
        renderPoiList(btn.dataset.category);
        updatePoiMarkers(btn.dataset.category)
    });

    resetBtn.addEventListener("click", clearAll);

    function clearAll() {
        clearMap();
        mapOverlays = [];
        mapMarkers = [];
        hasResult = false;
        input.value = '';
        infoPanel.style.display = "none";
        poiPanel.style.display = "none";
        document.getElementById("map-container").style.right = "0";
        resetBtn.style.display = "none";

        map.setCenter(new BMapGL.Point(SHANGHAI_CENTER.lng, SHANGHAI_CENTER.lat));
        map.setTilt(DEFAULT_TILT);
        map.setHeading(0);
    }

    function clearMap() {
        if (!map) return;
        mapOverlays.forEach(function (o) { map.removeOverlay(o); });
        mapMarkers.forEach(function (m) { map.removeOverlay(m); });
        poiLabels.forEach(function (l) { map.removeOverlay(l); });
        mapOverlays = [];
        mapMarkers = [];
        poiLabels = [];
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var community = input.value.trim();
        if (!community) return;
        setLoading(true);

        var thisRequestId = ++requestId;

        fetch("/api/calculate/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ community: community }),
        })
            .then(function (resp) {
                return resp.json().then(function (data) {
                    if (!resp.ok) throw new Error(data.error || "请求失败");
                    return data;
                });
            })
            .then(function (data) {
                if (thisRequestId !== requestId) return;
                showResult(data);
            })
            .catch(function (err) {
                if (thisRequestId !== requestId) return;
                alert("错误: " + err.message);
            })
            .finally(function () {
                if (thisRequestId === requestId) setLoading(false);
            });
    });

    function showResult(data) {
        currentResult = data;
        infoPanel.style.display = "block";
        resetBtn.style.display = "inline-block";

        clearMap();
        map.setCenter(new BMapGL.Point(data.center.lng, data.center.lat));
        map.setTilt(DEFAULT_TILT);
        map.setHeading(0);

        if (data.boundary && data.boundary.length > 0) {
            renderBoundary(data.boundary);
        }

        addCenterMarker(data.center);

        document.getElementById("info-address").textContent = data.address;
        document.getElementById("info-coords").textContent =
            data.center.lat.toFixed(4) + ", " + data.center.lng.toFixed(4);
        document.getElementById("info-budget").textContent = data.budget + "m";

        if (data.poi) {
            showPoiData(data);
            addPoiMarkers(allPois, "all");
        }

        hasResult = true;
    }

    function renderBoundary(boundary) {
        var path = boundary.map(function (p) {
            return new BMapGL.Point(p[1], p[0]);
        });

        var polygon = new BMapGL.Polygon(path, {
            strokeColor: "#1890ff",
            strokeWeight: 2,
            strokeOpacity: 0.8,
            strokeStyle: "dash",
            fillColor: "#1890ff",
            fillOpacity: 0.12,
        });

        map.addOverlay(polygon);
        mapOverlays.push(polygon);

        polygon.addEventListener("click", function () {
            if (currentResult) {
                localStorage.setItem("analysis_data", JSON.stringify(currentResult));
                window.location.href = "/analysis/";
            }
        });
    }

    function addCenterMarker(center) {
        var point = new BMapGL.Point(center.lng, center.lat);
        var marker = new BMapGL.Marker(point);
        map.addOverlay(marker);
        mapMarkers.push(marker);
    }

    function addPoiMarkers(pois, category) {
        poiLabels.forEach(function (l) { map.removeOverlay(l); });
        poiLabels = [];

        var filtered = category === "all"
            ? pois
            : pois.filter(function (p) { return p.category === category; });

        filtered.forEach(function (poi) {
            var color = CATEGORY_COLORS[poi.category] || "#999";
            var point = new BMapGL.Point(poi.lng, poi.lat);

            var label = new BMapGL.Label(poi.name, {
                position: point,
                offset: new BMapGL.Size(-30, -8),
            });
            label.setStyle({
                color: "#fff",
                backgroundColor: color,
                border: "none",
                borderRadius: "3px",
                padding: "2px 6px",
                fontSize: "11px",
                whiteSpace: "nowrap",
            });

            map.addOverlay(label);
            poiLabels.push(label);
        });
    }

    function updatePoiMarkers(category) {
        addPoiMarkers(allPois, category);
    }

    function showPoiData(data) {
        var poi = data.poi
        var blind_spot = data.blind_spot
        poiPanel.style.display = "block";
        document.getElementById("map-container").style.right = "320px";

        showScoreCard(poi.score);
        showBlindSpots(blind_spot);

        allPois = poi.pois || [];

        filterEl.innerHTML = "";
        var allBtn = document.createElement("button");
        allBtn.className = "poi-filter-btn active";
        allBtn.dataset.category = "all";
        allBtn.textContent = "全部 ";
        var allCount = document.createElement("span");
        allCount.className = "poi-filter-count";
        allCount.textContent = allPois.length;
        allBtn.appendChild(allCount);
        filterEl.appendChild(allBtn);

        var categories = poi.categories || {};
        Object.keys(categories).forEach(function (key) {
            var cat = categories[key];
            if (cat.count > 0) {
                var btn = document.createElement("button");
                btn.className = "poi-filter-btn";
                btn.dataset.category = key;
                btn.textContent = cat.label + " ";
                var cnt = document.createElement("span");
                cnt.className = "poi-filter-count";
                cnt.textContent = cat.count;
                cnt.style.color = CATEGORY_COLORS[key] || "#999";
                btn.appendChild(cnt);
                filterEl.appendChild(btn);
            }
        });

        renderPoiList("all");
    }

    function showScoreCard(score) {
        var el = document.getElementById("score-card");
        el.innerHTML = "";
        if (!score) return;

        var header = document.createElement("div");
        header.className = "score-header";

        var scoreNum = document.createElement("div");
        scoreNum.className = "score-number";
        scoreNum.textContent = score.score;

        var level = document.createElement("span");
        level.className = "score-level";
        level.style.background = LEVEL_COLORS[score.level] || "#999";
        level.textContent = score.level;

        header.appendChild(scoreNum);
        header.appendChild(level);

        el.appendChild(header);

        var detail = score.score_detail || {};
        var dims = [
            { label: "关键设施", value: detail.critical },
            { label: "多样性", value: detail.diversity },
            { label: "覆盖率", value: detail.coverage },
        ];

        dims.forEach(function (dim) {
            var row = document.createElement("div");
            row.className = "score-dim";

            var label = document.createElement("span");
            label.className = "score-dim-label";
            label.textContent = dim.label;

            var barWrap = document.createElement("div");
            barWrap.className = "score-bar-wrap";
            var bar = document.createElement("div");
            bar.className = "score-bar";
            bar.style.width = Math.round((dim.value || 0) * 100) + "%";
            barWrap.appendChild(bar);

            var val = document.createElement("span");
            val.className = "score-dim-value";
            val.textContent = Math.round((dim.value || 0) * 100) + "%";

            row.appendChild(label);
            row.appendChild(barWrap);
            row.appendChild(val);
            el.appendChild(row);
        });
    }

    function showBlindSpots(blind_spot) {
        answer_type = blind_spot["answer_type"] // number
        llm_result = blind_spot["llm_result"] // string
        keyword_result = blind_spot["keyword_result"] // list[dict]

        var el = document.getElementById("blind-spots");
        el.innerHTML = "";

        if (answer_type === -1) {
            el.style.display = "none";
            return;
        }

        el.style.display = "block";
        var title = document.createElement("div");
        title.className = "blind-spots-title";
        title.textContent = "服务盲区检测";
        el.appendChild(title);

        if (answer_type === 1) {
            var reason = document.createElement("div");
            reason.className = "blind-spots-llm-result";
            reason.textContent = llm_result;
            el.appendChild(reason)
        } else {
            var tags = document.createElement("div");
            tags.className = "blind-spots-tags";

            keyword_result.forEach(function (spot) {
                var tag = document.createElement("span");
                tag.className = "blind-spot-tag";
                tag.textContent = "缺少" + spot.label;
                tags.appendChild(tag);
            });

            el.appendChild(tags);
        }
    }

    function renderPoiList(filterCategory) {
        var listEl = document.getElementById("poi-list");
        listEl.innerHTML = "";

        var filtered = filterCategory === "all"
            ? allPois
            : allPois.filter(function (p) { return p.category === filterCategory; });

        filtered.forEach(function (poi) {
            var item = document.createElement("div");
            item.className = "poi-item";

            var header = document.createElement("div");
            header.className = "poi-item-header";

            var dot = document.createElement("span");
            dot.className = "poi-dot";
            dot.style.backgroundColor = CATEGORY_COLORS[poi.category] || "#999";

            var name = document.createElement("span");
            name.className = "poi-name";
            name.textContent = poi.name;

            header.appendChild(dot);
            header.appendChild(name);

            var address = document.createElement("div");
            address.className = "poi-address";
            address.textContent = poi.address || "";

            item.appendChild(header);
            item.appendChild(address);
            listEl.appendChild(item);
        });
    }

    function setLoading(on) {
        loading.style.display = on ? "flex" : "none";
        btn.disabled = on;
    }

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            var cookies = document.cookie.split(";");
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === name + "=") {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    var ruleOverlay = null;
    var ruleTextarea = null;

    function createRuleModal() {
        ruleOverlay = document.createElement("div");
        ruleOverlay.className = "rule-modal-overlay";
        ruleOverlay.style.display = "none";

        var modal = document.createElement("div");
        modal.className = "rule-modal";

        var header = document.createElement("div");
        header.className = "rule-modal-header";

        var title = document.createElement("span");
        title.textContent = "盲区检测规则";

        var closeBtn = document.createElement("button");
        closeBtn.className = "rule-modal-close";
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", closeRuleModal);

        header.appendChild(title);
        header.appendChild(closeBtn);

        ruleTextarea = document.createElement("textarea");
        ruleTextarea.className = "rule-modal-textarea";
        ruleTextarea.rows = 6;
        ruleTextarea.placeholder = "输入盲区检测规则，如：周边1公里内没有菜市场、药店或小学的地点为服务盲区点位";

        var footer = document.createElement("div");
        footer.className = "rule-modal-footer";

        var cancelBtn = document.createElement("button");
        cancelBtn.className = "rule-modal-cancel";
        cancelBtn.textContent = "取消";
        cancelBtn.addEventListener("click", closeRuleModal);

        var saveBtn = document.createElement("button");
        saveBtn.className = "rule-modal-save";
        saveBtn.textContent = "保存";
        saveBtn.addEventListener("click", saveRule);

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        modal.appendChild(header);
        modal.appendChild(ruleTextarea);
        modal.appendChild(footer);
        ruleOverlay.appendChild(modal);

        ruleOverlay.addEventListener("click", function (e) {
            if (e.target === ruleOverlay) closeRuleModal();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && ruleOverlay.style.display !== "none") {
                closeRuleModal();
            }
        });

        document.body.appendChild(ruleOverlay);
    }

    function openRuleModal() {
        if (!ruleOverlay) createRuleModal();
        ruleTextarea.value = "";

        fetch("/api/blind-spot-rule/")
            .then(function (resp) { return resp.json(); })
            .then(function (data) {
                ruleTextarea.value = data.rule_text || "";
            })
            .catch(function () {
                ruleTextarea.value = "";
            });

        ruleOverlay.style.display = "flex";
        ruleTextarea.focus();
    }

    function closeRuleModal() {
        if (ruleOverlay) ruleOverlay.style.display = "none";
    }

    function saveRule() {
        var text = ruleTextarea.value.trim();
        if (!text) {
            alert("规则文本不能为空");
            return;
        }

        fetch("/api/blind-spot-rule/update/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ rule_text: text }),
        })
            .then(function (resp) {
                return resp.json().then(function (data) {
                    if (!resp.ok) throw new Error(data.error || "保存失败");
                    return data;
                });
            })
            .then(function () {
                closeRuleModal();
            })
            .catch(function (err) {
                alert("保存失败: " + err.message);
            });
    }

    ruleBtn.addEventListener("click", openRuleModal);
})();
