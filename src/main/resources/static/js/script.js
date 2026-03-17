let currentLoginUser = null;
let currentLoginId = null;
let currentUserRole = null;

// --- 화면 전환 함수 ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

function showTab(tab) {
    document.getElementById('tab-work').style.display = 'none';
    document.getElementById('tab-memo').style.display = 'none';
    document.getElementById('tab-erp').style.display = 'none';

    document.getElementById('tab-' + tab).style.display = 'block';

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-tab-' + tab).classList.add('active');

    if (tab === 'work') loadWorkLogs();
    if (tab === 'memo') loadMemos(0);
    if (tab === 'erp') {
        // ERP 버튼을 누르면 '인력 관리' 탭을 자동으로 보여주고 데이터도 바로 불러옵니다!
        showErpSubTab('personnel');
    }
}

// --- 1. 회원가입 ---
function join() {
    const name = document.getElementById('joinName').value;
    const id = document.getElementById('joinId').value;
    const pw = document.getElementById('joinPw').value;
    const pwCheck = document.getElementById('joinPwCheck').value;
    const role = document.querySelector('input[name="userRole"]:checked').value;

    if (!name || !id || !pw) return alert("모든 항목을 입력하세요.");
    if (pw !== pwCheck) return alert("비밀번호가 일치하지 않습니다.");

    fetch('/api/join', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name, loginId: id, password: pw, role: role})
    }).then(res => {
        if (res.ok) {
            alert("회원가입 완료! 로그인해주세요.");
            document.getElementById('joinName').value = '';
            document.getElementById('joinId').value = '';
            document.getElementById('joinPw').value = '';
            document.getElementById('joinPwCheck').value = '';
            showScreen('login-screen');
        } else {
            res.text().then(text => alert(text));
        }
    });
}

// --- 2. 로그인/로그아웃 ---
function login() {
    const id = document.getElementById('loginId').value;
    const pw = document.getElementById('loginPw').value;

    fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({loginId: id, password: pw})
    }).then(async res => {
        // 성공하면 json 반환, 실패하면 서버의 에러 메시지(text)를 뽑아서 던짐
        if (res.ok) return res.json();
        const errMsg = await res.text();
        throw new Error(errMsg);
    }).then(member => {
        currentLoginUser = member.name;
        currentLoginId = member.loginId;
        currentUserRole = member.role;

        document.getElementById('display-username').innerText = member.name + " 님";
        document.getElementById('detail-username').innerText = member.name + " 님";

        const erpBtn = document.getElementById('btn-tab-erp');
        if (erpBtn) {
            if (member.role === 'ADMIN') {
                erpBtn.style.display = 'inline-block';
            } else {
                erpBtn.style.display = 'none';
            }
        }

        showScreen('main-screen');
        showTab('work');
    }).catch(err => {
        // 여기서 "비활성화된 계정입니다." 또는 "비밀번호가 일치하지 않습니다."가 뜹니다!
        alert(err.message);
    });
}

function logout() {
    fetch('/api/logout', {method: 'POST'}).then(() => location.reload());
}

// --- 3. 출퇴근 ---
function loadWorkLogs() {
    fetch('/api/work')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('work-list-body');
            tbody.innerHTML = '';
            data.forEach(log => {
                if (log.memberLoginId === currentLoginId && !log.endTime) {
                    window.myCurrentLogId = log.id;
                }
                let end = log.endTime ? log.endTime.replace('T', ' ') : '-';
                tbody.innerHTML += `<tr><td>${log.memberName}</td><td>${log.startTime.replace('T', ' ')}</td><td>${end}</td></tr>`;
            });
        });
}

function checkInAction() {
    if (!confirm("출근 처리하시겠습니까?")) return;

    fetch('/api/work/start', {method: 'POST'})
        .then(async res => {
            if (res.ok) {
                alert("출근 완료");
                loadWorkLogs();
            } else {
                let msg = await res.text();
                alert(msg);
            }
        });
}

function checkOutAction() {
    if (!confirm("퇴근 처리하시겠습니까?")) return;
    if (!window.myCurrentLogId) return alert("출근 기록이 없습니다.");

    fetch(`/api/work/end/${window.myCurrentLogId}`, {method: 'POST'}).then(() => {
        alert("퇴근 완료");
        window.myCurrentLogId = null;
        loadWorkLogs();
    });
}

// --- 4. 메모 ---
function loadMemos(page) {
    fetch(`/api/memos?page=${page}&size=5`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('memo-list-body');
            tbody.innerHTML = '';
            data.content.forEach(memo => {
                tbody.innerHTML += `
                    <tr onclick="openMemoDetail(${memo.id}, '${memo.writerLoginId}', '${memo.content.replace(/\n/g, '\\n')}')">
                        <td>${memo.writerName}</td>
                        <td>${memo.content.substring(0, 30)}...</td>
                        <td>${memo.regDate.replace('T', ' ')}</td>
                    </tr>`;
            });
            renderPagination(data.totalPages);
        });
}

function renderPagination(totalPages) {
    const div = document.getElementById('pagination');
    div.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        div.innerHTML += `<button class="page-btn" onclick="loadMemos(${i})">${i+1}</button>`;
    }
}

function openMemoWrite() {
    showScreen('memo-detail-screen');
    document.getElementById('memo-content').value = '';
    document.getElementById('memo-content').readOnly = false;

    document.getElementById('btn-save').style.display = 'inline-block';
    document.getElementById('btn-edit').style.display = 'none';
    document.getElementById('btn-del').style.display = 'none';
}

function openMemoDetail(id, writerId, content) {
    showScreen('memo-detail-screen');
    document.getElementById('memo-content').value = content;
    document.getElementById('memo-id').value = id;

    const isMyPost = (writerId === currentLoginId);

    document.getElementById('memo-content').readOnly = !isMyPost;
    document.getElementById('btn-save').style.display = 'none';
    document.getElementById('btn-edit').style.display = isMyPost ? 'inline-block' : 'none';
    document.getElementById('btn-del').style.display = isMyPost ? 'inline-block' : 'none';
}

function closeMemoDetail() {
    showScreen('main-screen');
    loadMemos(0);
}

function saveMemo() {
    const content = document.getElementById('memo-content').value;
    fetch('/api/memos', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: content})
    }).then(() => { closeMemoDetail(); });
}

function updateMemo() {
    if(!confirm("수정하시겠습니까?")) return;
    const id = document.getElementById('memo-id').value;
    const content = document.getElementById('memo-content').value;
    fetch(`/api/memos/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: content})
    }).then(res => {
        if(res.ok) { alert("수정됨"); closeMemoDetail(); }
        else alert("권한이 없습니다.");
    });
}

function deleteMemo() {
    if(!confirm("삭제하시겠습니까?")) return;
    const id = document.getElementById('memo-id').value;
    fetch(`/api/memos/${id}`, { method: 'DELETE' })
        .then(res => {
            if(res.ok) { alert("삭제됨"); closeMemoDetail(); }
            else alert("권한이 없습니다.");
        });
}

// // --- 5. 사장님 전용 ERP 기능 ---
// function loadMonthlyWork() {
//     const year = document.getElementById('erp-year').value;
//     const month = document.getElementById('erp-month').value;
//
//     fetch(`/api/admin/work/monthly?year=${year}&month=${month}`)
//         .then(res => res.json())
//         .then(data => {
//             const tbody = document.getElementById('erp-work-list-body');
//             tbody.innerHTML = '';
//
//             if(data.length === 0) {
//                 tbody.innerHTML = `<tr><td colspan="4">해당 월의 기록이 없습니다.</td></tr>`;
//                 return;
//             }
//
//             data.forEach(log => {
//                 let startText = log.startTime ? log.startTime.replace('T', ' ') : '<span style="color:red">누락</span>';
//                 let endText = log.endTime ? log.endTime.replace('T', ' ') : '<span style="color:red">누락</span>';
//
//                 // 시간이 누락된 경우에만 '입력' 버튼을 만들어 줍니다.
//                 let actionBtns = '';
//                 if (!log.startTime) {
//                     actionBtns += `<button onclick="insertMissedTime(${log.id}, 'start')" style="margin-right:5px; font-size:12px;">출근입력</button>`;
//                 }
//                 if (!log.endTime) {
//                     actionBtns += `<button onclick="insertMissedTime(${log.id}, 'end')" style="font-size:12px;">퇴근입력</button>`;
//                 }
//                 if (log.startTime && log.endTime) {
//                     actionBtns = '완료';
//                 }
//
//                 tbody.innerHTML += `
//                     <tr>
//                         <td>${log.memberName}</td>
//                         <td>${startText}</td>
//                         <td>${endText}</td>
//                         <td>${actionBtns}</td>
//                     </tr>`;
//             });
//         });
// }

function insertMissedTime(logId, type) {
    const timeStr = prompt("시간을 입력하세요\n형식 예시: 2026-03-17T18:00:00");
    if (!timeStr) return;

    const bodyData = {};
    if (type === 'start') bodyData.startTime = timeStr;
    if (type === 'end') bodyData.endTime = timeStr;

    fetch(`/api/admin/work/insert/${logId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyData)
    }).then(async res => {
        if(res.ok) {
            alert("입력 완료!");
            loadMonthlyWork(); // 새로고침
        } else {
            alert(await res.text()); // 에러 메시지 팝업
        }
    });
}

// ERP 하위 탭 전환
function showErpSubTab(tab) {
    document.getElementById('erp-sub-personnel').style.display = (tab === 'personnel') ? 'block' : 'none';
    document.getElementById('erp-sub-stats').style.display = (tab === 'stats') ? 'block' : 'none';

    document.getElementById('btn-sub-personnel').style.background = (tab === 'personnel') ? '#ddd' : 'white';
    document.getElementById('btn-sub-stats').style.background = (tab === 'stats') ? '#ddd' : 'white';

    if (tab === 'personnel') loadPersonnel();
    if (tab === 'stats') loadMonthlyWork();
}

// 1. 알바생 인력 리스트 로드
function loadPersonnel() {
    fetch('/api/admin/members')
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('erp-personnel-list-body');
            tbody.innerHTML = '';

            data.forEach(member => {
                let statusText = member.active ? '<span style="color:green; font-weight:bold;">활성</span>' : '<span style="color:red;">퇴사(제한)</span>';
                let roleText = member.role === 'ADMIN' ? '사장님' : '알바생';
                let wage = member.hourlyWage ? member.hourlyWage.toLocaleString() + '원' : '-';

                tbody.innerHTML += `
                    <tr>
                        <td>${member.name} (${member.loginId})</td>
                        <td>${roleText}</td>
                        <td>${statusText}</td>
                        <td>${member.position || '-'}</td>
                        <td>${wage}</td>
                        <td>${member.regularShift || '-'}</td>
                        <td>
                            <button onclick="openEditModal(${member.id}, '${member.name}', ${member.active}, '${member.position || ''}', '${member.hourlyWage || ''}', '${member.regularShift || ''}')" style="padding:5px 10px; cursor:pointer;">정보 수정</button>
                        </td>
                    </tr>
                `;
            });
        });
}

// 2. 직원 정보 수정 팝업(Modal) 열기/닫기/저장
function openEditModal(id, name, isActive, position, wage, shift) {
    document.getElementById('edit-modal-title').innerText = `${name} 님 정보 수정`;
    document.getElementById('edit-member-id').value = id;
    document.getElementById('edit-member-active').value = isActive ? "true" : "false";
    document.getElementById('edit-member-position').value = position;
    document.getElementById('edit-member-wage').value = wage;
    document.getElementById('edit-member-shift').value = shift;

    document.getElementById('member-edit-modal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('member-edit-modal').style.display = 'none';
}

// 직원 정보 수정 팝업(Modal) 저장 로직
function updateMemberInfo() {
    const id = document.getElementById('edit-member-id').value;
    let wageVal = document.getElementById('edit-member-wage').value;

    const bodyData = {
        active: document.getElementById('edit-member-active').value === "true",
        position: document.getElementById('edit-member-position').value,
        wage: wageVal ? parseInt(wageVal) : null,
        shift: document.getElementById('edit-member-shift').value
    };

    fetch(`/api/admin/members/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyData)
    }).then(async res => {
        if (res.ok) {
            alert("정보가 성공적으로 수정되었습니다.");
            closeEditModal();
            loadPersonnel(); // 목록 새로고침
        } else {
            let errMsg = await res.text();
            alert("수정 실패: " + errMsg);
        }
    });
}

// 3. 월별 기록 및 통계 계산 (업그레이드 버전)
function loadMonthlyWork() {
    const year = document.getElementById('erp-year').value;
    const month = document.getElementById('erp-month').value;

    fetch(`/api/admin/work/monthly?year=${year}&month=${month}`)
        .then(res => res.json())
        .then(data => {
            const listBody = document.getElementById('erp-work-list-body');
            const statsBody = document.getElementById('erp-stats-body');
            listBody.innerHTML = '';
            statsBody.innerHTML = '';

            const statsObj = {};

            if(data.length === 0) {
                listBody.innerHTML = `<tr><td colspan="4">해당 월의 상세 기록이 없습니다.</td></tr>`;
                statsBody.innerHTML = `<tr><td colspan="3">통계 데이터가 없습니다.</td></tr>`;
                return;
            }

            data.forEach(log => {
                // [수정1] 시간 포맷 깔끔하게 자르기 (.substring(0, 19) 쓰면 소수점 밀리초가 날아갑니다!)
                let startText = log.startTime ? log.startTime.substring(0, 19).replace('T', ' ') : '<span style="color:red">누락</span>';
                let endText = log.endTime ? log.endTime.substring(0, 19).replace('T', ' ') : '<span style="color:red">누락</span>';

                let actionBtns = '';
                if (!log.startTime) actionBtns += `<button onclick="insertMissedTime(${log.id}, 'start')" style="margin-right:5px; font-size:12px;">출근보완</button>`;
                if (!log.endTime) actionBtns += `<button onclick="insertMissedTime(${log.id}, 'end')" style="font-size:12px;">퇴근보완</button>`;
                if (log.startTime && log.endTime) actionBtns = '정상처리';

                listBody.innerHTML += `
                    <tr>
                        <td>${log.memberName}</td>
                        <td>${startText}</td>
                        <td>${endText}</td>
                        <td>${actionBtns}</td>
                    </tr>`;

                if (log.startTime && log.endTime) {
                    let startDate = new Date(log.startTime);
                    let endDate = new Date(log.endTime);
                    let diffHours = (endDate - startDate) / (1000 * 60 * 60);

                    // [수정2] 날짜만 추출 (예: '2026-03-17')
                    let dateStr = log.startTime.substring(0, 10);

                    if (!statsObj[log.memberName]) {
                        // 중복을 알아서 걸러주는 Set 자료구조 사용
                        statsObj[log.memberName] = { datesWorked: new Set(), hours: 0 };
                    }

                    // Set에 추가 (같은 날짜면 알아서 무시됨 = 하루에 10번 출퇴근해도 1일)
                    statsObj[log.memberName].datesWorked.add(dateStr);
                    statsObj[log.memberName].hours += diffHours;
                }
            });

            for (const [name, stat] of Object.entries(statsObj)) {
                statsBody.innerHTML += `
                    <tr>
                        <td style="font-weight:bold;">${name}</td>
                        <td>${stat.datesWorked.size} 일</td> <td>${stat.hours.toFixed(1)} 시간</td>
                    </tr>
                `;
            }
        });
}