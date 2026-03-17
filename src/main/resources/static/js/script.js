let currentLoginUser = null; // {name, loginId}
let currentLoginId = null;

// --- 화면 전환 함수 ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(el => el.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
}

function showTab(tab) {
    document.getElementById('tab-work').style.display = (tab === 'work') ? 'block' : 'none';
    document.getElementById('tab-memo').style.display = (tab === 'memo') ? 'block' : 'none';

    // 탭 스타일 활성화
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-tab-' + tab).classList.add('active');

    if (tab === 'work') loadWorkLogs();
    if (tab === 'memo') loadMemos(0);
}

// --- 1. 회원가입 ---
function join() {
    const name = document.getElementById('joinName').value;
    const id = document.getElementById('joinId').value;
    const pw = document.getElementById('joinPw').value;
    const pwCheck = document.getElementById('joinPwCheck').value;

    if (!name || !id || !pw) return alert("모든 항목을 입력하세요.");
    if (pw !== pwCheck) return alert("비밀번호가 일치하지 않습니다.");

    fetch('/api/join', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name, loginId: id, password: pw})
    }).then(res => {
        if (res.ok) {
            alert("회원가입 완료! 로그인해주세요.");
            showScreen('login-screen');
        } else {
            res.text().then(text => alert(text)); // "이미 존재하는 아이디입니다" 등
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
    }).then(res => {
        if (res.ok) return res.json();
        throw new Error("로그인 실패");
    }).then(member => {
        currentLoginUser = member.name;
        currentLoginId = member.loginId;

        // 사용자 이름 표시
        document.getElementById('display-username').innerText = member.name + " 님";
        document.getElementById('detail-username').innerText = member.name + " 님";

        showScreen('main-screen');
        showTab('work');
    }).catch(err => alert("아이디 또는 비밀번호를 확인하세요."));
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
                // 내 기록인지 확인해서 ID 저장 (퇴근용)
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
                // 서버에서 보낸 에러 메시지("이미 출근 처리가 되어있습니다.")를 받아서 띄움
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

// --- 4. 메모 (전달사항) ---
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

// 페이지네이션 그리기
function renderPagination(totalPages) {
    const div = document.getElementById('pagination');
    div.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        div.innerHTML += `<button class="page-btn" onclick="loadMemos(${i})">${i+1}</button>`;
    }
}

// --- 5. 메모 상세/작성 화면 제어 ---
function openMemoWrite() {
    showScreen('memo-detail-screen');
    document.getElementById('memo-content').value = ''; // 초기화
    document.getElementById('memo-content').readOnly = false;

    // 버튼 제어 (저장 버튼만 보임)
    document.getElementById('btn-save').style.display = 'inline-block';
    document.getElementById('btn-edit').style.display = 'none';
    document.getElementById('btn-del').style.display = 'none';
}

function openMemoDetail(id, writerId, content) {
    showScreen('memo-detail-screen');
    document.getElementById('memo-content').value = content;
    document.getElementById('memo-id').value = id;

    // 버튼 제어: 내가 쓴 글이면 수정/삭제 보임
    const isMyPost = (writerId === currentLoginId);

    document.getElementById('memo-content').readOnly = !isMyPost; // 내 글 아니면 읽기 전용
    document.getElementById('btn-save').style.display = 'none';
    document.getElementById('btn-edit').style.display = isMyPost ? 'inline-block' : 'none';
    document.getElementById('btn-del').style.display = isMyPost ? 'inline-block' : 'none';
}

function closeMemoDetail() {
    showScreen('main-screen');
    loadMemos(0);
}

// API 호출 (작성/수정/삭제)
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