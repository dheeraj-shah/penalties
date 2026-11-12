"""Exercise the actual Worker reservation SQL against SQLite, including concurrency."""
import concurrent.futures, pathlib, re, sqlite3, tempfile
sql = re.search(r'RESERVE_SQL=`([^`]+)`', pathlib.Path('worker.js').read_text()).group(1)
def database(path):
    with sqlite3.connect(path) as db:
        db.executescript(pathlib.Path('schema.sql').read_text())
def reserve(path,i,now,visitor):
    with sqlite3.connect(path, timeout=30) as db:
        return bool(db.execute(sql, (str(i),visitor,now,now-60000)).fetchall())
with tempfile.TemporaryDirectory() as tmp:
    p=tmp+'/requests.db';database(p)
    with sqlite3.connect(p) as db:
        db.executemany('INSERT INTO requests VALUES (?,?,?)',[(str(i),'old',0) for i in range(99)])
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        results=list(pool.map(lambda i:reserve(p,i,100000000,'v'+str(i)),range(100,125)))
    assert sum(results)==10, results
    p=tmp+'/minute.db';database(p)
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        results=list(pool.map(lambda i:reserve(p,i,100000000,'v'+str(i)),range(25)))
    assert sum(results)==10,results
    p=tmp+'/daily.db';database(p)
    assert sum(reserve(p,i,100000000+i*61000,'same') for i in range(15))==15
print('PASS: lifetime/day quotas removed; concurrent ten-per-minute throttle enforced')
