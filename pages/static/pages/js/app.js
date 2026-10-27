(function () {
    var gallery = document.getElementById("projectCarousel");
    var projects = []

    gallery.addEventListener(
        "DOMContentLoaded",
        function () {
            fetch("")
            initProjects();
        }
    )

    function initProjects() {

    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var community = input.value.trim();
        if (!community) return;
        setLoading(true);

        var thisRequestId = ++requestId;

        fetch("/api/getblobs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ projectId: projectId }),
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
