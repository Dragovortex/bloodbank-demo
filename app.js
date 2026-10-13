// Online demo of the Blood Bank system.
// The real project runs on PHP + MySQL (XAMPP); this demo keeps the data in the browser.
(function () {
    var GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    var KEY = 'bloodbank-demo-v1';
    var SEED = {
        donors: [
            { id: 1, name: 'Rahul Sharma', age: 24, gender: 'Male', blood_group: 'B+', city: 'Pune', mobile: '9876543210' },
            { id: 2, name: 'Priya Patil', age: 22, gender: 'Female', blood_group: 'O+', city: 'Pune', mobile: '9823456712' },
            { id: 3, name: 'Amit Joshi', age: 30, gender: 'Male', blood_group: 'AB+', city: 'Mumbai', mobile: '9765432108' },
            { id: 4, name: 'Sneha Kulkarni', age: 26, gender: 'Female', blood_group: 'A+', city: 'Pune', mobile: '9890123456' },
            { id: 5, name: 'Rohan Deshmukh', age: 28, gender: 'Male', blood_group: 'A+', city: 'Nashik', mobile: '9912345678' },
            { id: 6, name: 'Neha Gupta', age: 23, gender: 'Female', blood_group: 'O-', city: 'Mumbai', mobile: '9801234567' }
        ],
        requests: [
            { id: 1, name: 'Kiran Pawar', blood_group: 'A+', city: 'Pune', mobile: '9856231470', status: 'Completed' },
            { id: 2, name: 'Meera Shah', blood_group: 'B+', city: 'Mumbai', mobile: '9745123680', status: 'Pending' },
            { id: 3, name: 'Suresh More', blood_group: 'O+', city: 'Pune', mobile: '9632587410', status: 'Pending' }
        ]
    };

    function load() {
        try {
            var saved = JSON.parse(localStorage.getItem(KEY));
            if (saved && saved.donors && saved.requests) return saved;
        } catch (err) {}
        return JSON.parse(JSON.stringify(SEED));
    }

    function save(db) {
        try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (err) {}
    }

    function isAdmin() {
        try { return sessionStorage.getItem('bloodbank-admin') === '1'; } catch (err) { return false; }
    }

    function setAdmin(on) {
        try {
            if (on) sessionStorage.setItem('bloodbank-admin', '1');
            else sessionStorage.removeItem('bloodbank-admin');
        } catch (err) {}
    }

    function e(value) {
        return String(value).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
        });
    }

    function nextId(rows) {
        return rows.reduce(function (max, r) { return Math.max(max, r.id); }, 0) + 1;
    }

    var db = load();
    var page = location.pathname.split('/').pop() || 'index.html';
    var main = document.querySelector('main');

    // Navigation: show Dashboard + Logout when the admin is logged in
    if (isAdmin()) {
        var loginLink = document.querySelector('.nav-links a[href="admin_login.html"]');
        if (loginLink) {
            loginLink.href = 'admin_dashboard.html';
            loginLink.textContent = 'Dashboard';
            loginLink.className = page === 'admin_dashboard.html' ? 'active' : '';
        }
        var logout = document.createElement('a');
        logout.href = '#';
        logout.textContent = 'Logout';
        logout.addEventListener('click', function (ev) {
            ev.preventDefault();
            setAdmin(false);
            location.href = 'admin_login.html';
        });
        document.querySelector('.nav-links').appendChild(logout);
    }
    if (page === 'admin_dashboard.html') {
        var viewLink = document.querySelector('.nav-links a[href="view_requests.html"]');
        if (viewLink) viewLink.className = '';
    }

    function showMessages(form, type, messages) {
        var box = form.parentNode;
        Array.prototype.forEach.call(box.querySelectorAll('.msg'), function (m) { m.remove(); });
        messages.forEach(function (text) {
            var p = document.createElement('p');
            p.className = 'msg ' + type;
            p.textContent = text;
            box.insertBefore(p, form);
        });
    }

    function values(form) {
        var out = {};
        Array.prototype.forEach.call(form.elements, function (el) {
            if (el.name) out[el.name] = el.value.trim();
        });
        return out;
    }

    function validMobile(mobile) {
        return /^[0-9]{10}$/.test(mobile);
    }

    // Donor registration
    if (page === 'register.html') {
        var regForm = document.querySelector('form');
        regForm.noValidate = true;
        regForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var v = values(regForm);
            var errors = [];
            if (!v.name || !v.age || !v.gender || !v.blood_group || !v.city || !v.mobile) {
                errors.push('All fields are required.');
            } else {
                if (!/^[0-9]+$/.test(v.age) || v.age < 18 || v.age > 65) errors.push('Age must be between 18 and 65.');
                if (!validMobile(v.mobile)) errors.push('Invalid mobile number. Enter exactly 10 digits.');
            }
            if (errors.length) return showMessages(regForm, 'error', errors);
            v.id = nextId(db.donors);
            v.age = Number(v.age);
            db.donors.push(v);
            save(db);
            regForm.reset();
            showMessages(regForm, 'success', ['Donor registered successfully!']);
        });
    }

    // Blood request
    if (page === 'request.html') {
        var reqForm = document.querySelector('form');
        reqForm.noValidate = true;
        reqForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var v = values(reqForm);
            var errors = [];
            if (!v.name || !v.blood_group || !v.city || !v.mobile) {
                errors.push('All fields are required.');
            } else if (!validMobile(v.mobile)) {
                errors.push('Invalid mobile number. Enter exactly 10 digits.');
            }
            if (errors.length) return showMessages(reqForm, 'error', errors);
            v.id = nextId(db.requests);
            v.status = 'Pending';
            db.requests.push(v);
            save(db);
            reqForm.reset();
            showMessages(reqForm, 'success', ['Blood request submitted successfully!']);
        });
    }

    // Search donors by blood group
    if (page === 'search.html') {
        var searchForm = document.querySelector('form');
        var results = document.createElement('div');
        results.className = 'table-wrap';
        main.appendChild(results);
        searchForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var group = searchForm.elements.blood_group.value;
            if (!group) return;
            var found = db.donors.filter(function (d) { return d.blood_group === group; });
            if (!found.length) {
                results.innerHTML = '<p class="msg error center">No donors found for blood group ' + e(group) + '.</p>';
                return;
            }
            results.innerHTML = '<table><tr><th>Name</th><th>Age</th><th>Gender</th><th>Blood Group</th><th>City</th><th>Mobile</th></tr>' +
                found.map(function (d) {
                    return '<tr><td>' + e(d.name) + '</td><td>' + e(d.age) + '</td><td>' + e(d.gender) + '</td><td>' +
                        e(d.blood_group) + '</td><td>' + e(d.city) + '</td><td>' + e(d.mobile) + '</td></tr>';
                }).join('') + '</table>';
        });
    }

    // Admin login
    if (page === 'admin_login.html') {
        if (isAdmin()) return void (location.href = 'admin_dashboard.html');
        var loginForm = document.querySelector('form');
        loginForm.noValidate = true;
        loginForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var v = values(loginForm);
            if (!v.username || !loginForm.elements.password.value) {
                return showMessages(loginForm, 'error', ['Please enter username and password.']);
            }
            if (v.username === 'admin' && loginForm.elements.password.value === 'admin123') {
                setAdmin(true);
                location.href = 'admin_dashboard.html';
                return;
            }
            showMessages(loginForm, 'error', ['Invalid username or password.']);
        });
    }

    // Blood requests list
    function renderRequests() {
        var admin = isAdmin();
        var html = '<div class="dashboard"><h2>Blood Requests</h2><div class="table-wrap">';
        if (!db.requests.length) {
            html += '<p class="msg error center">No blood requests yet.</p>';
        } else {
            html += '<table><tr><th>Sr.No</th><th>Name</th><th>Blood</th><th>City</th><th>Mobile</th><th>Status</th>' +
                (admin ? '<th>Action</th>' : '') + '</tr>';
            db.requests.forEach(function (r, i) {
                html += '<tr><td>' + (i + 1) + '</td><td>' + e(r.name) + '</td><td>' + e(r.blood_group) + '</td><td>' +
                    e(r.city) + '</td><td>' + e(r.mobile) + '</td><td class="status ' + e(r.status.toLowerCase()) + '">' + e(r.status) + '</td>';
                if (admin) {
                    html += '<td>';
                    if (r.status === 'Pending') {
                        html += '<button class="link" data-complete="' + r.id + '">Mark Completed</button> | ';
                    }
                    html += '<button class="link danger" data-delete="' + r.id + '">Delete</button></td>';
                }
                html += '</tr>';
            });
            html += '</table>';
        }
        html += '</div>' + (admin ? '' : '<p class="note">Login as admin to update or delete requests.</p>') + '</div>';
        main.innerHTML = html;
    }

    if (page === 'view_requests.html') {
        renderRequests();
        main.addEventListener('click', function (ev) {
            if (!isAdmin()) return;
            var complete = ev.target.getAttribute('data-complete');
            var remove = ev.target.getAttribute('data-delete');
            if (complete) {
                db.requests.forEach(function (r) { if (r.id === Number(complete)) r.status = 'Completed'; });
            } else if (remove && confirm('Delete this request?')) {
                db.requests = db.requests.filter(function (r) { return r.id !== Number(remove); });
            } else {
                return;
            }
            save(db);
            renderRequests();
        });
    }

    // Admin dashboard
    function renderDashboard() {
        var pending = db.requests.filter(function (r) { return r.status === 'Pending'; }).length;
        var html = '<div class="dashboard"><h2>&#128202; Admin Dashboard</h2>' +
            '<p class="welcome">Logged in as <strong>admin</strong></p><div class="stats">' +
            '<div class="stat red"><span>&#129656; Total Donors</span><strong>' + db.donors.length + '</strong></div>' +
            '<div class="stat blue"><span>&#128197; Total Requests</span><strong>' + db.requests.length + '</strong></div>' +
            '<div class="stat yellow"><span>&#128993; Pending</span><strong>' + pending + '</strong></div>' +
            '<div class="stat green"><span>&#128994; Completed</span><strong>' + (db.requests.length - pending) + '</strong></div>' +
            '</div><h3>Blood Group Wise Count</h3><div class="groups">';
        GROUPS.forEach(function (g) {
            var total = db.donors.filter(function (d) { return d.blood_group === g; }).length;
            html += '<div class="group"><span>' + g + '</span><strong>' + total + '</strong></div>';
        });
        html += '</div><h3>All Donors</h3><div class="table-wrap">';
        if (!db.donors.length) {
            html += '<p class="msg error center">No donors registered yet.</p>';
        } else {
            html += '<table><tr><th>Sr.No</th><th>Name</th><th>Age</th><th>Gender</th><th>Blood</th><th>City</th><th>Mobile</th><th>Action</th></tr>';
            db.donors.forEach(function (d, i) {
                html += '<tr><td>' + (i + 1) + '</td><td>' + e(d.name) + '</td><td>' + e(d.age) + '</td><td>' + e(d.gender) + '</td><td>' +
                    e(d.blood_group) + '</td><td>' + e(d.city) + '</td><td>' + e(d.mobile) +
                    '</td><td><button class="link danger" data-delete="' + d.id + '">Delete</button></td></tr>';
            });
            html += '</table>';
        }
        main.innerHTML = html + '</div></div>';
    }

    if (page === 'admin_dashboard.html') {
        if (!isAdmin()) return void (location.href = 'admin_login.html');
        renderDashboard();
        main.addEventListener('click', function (ev) {
            var remove = ev.target.getAttribute('data-delete');
            if (remove && confirm('Delete this donor?')) {
                db.donors = db.donors.filter(function (d) { return d.id !== Number(remove); });
                save(db);
                renderDashboard();
            }
        });
    }
})();
