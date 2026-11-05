# Backend Engineer — Concurrency

## Processes, threads and async I/O
- id: be-conc-01
- round: CONCURRENCY
- difficulty: medium
- levels:
- tags: processes, threads, async, I/O-bound, CPU-bound, GIL

### Prompt
Explain the differences between processes, threads and async I/O. How do you choose between them for a backend service, for I/O-bound versus CPU-bound work?

### Answer
#### What the interviewer is really testing
- Clear mental models of **processes, threads and coroutines** (memory, scheduling, cost).
- Distinguishing **concurrency** (dealing with many things) from **parallelism** (doing many things at once).
- Matching the model to **I/O-bound vs CPU-bound** workloads.
- Language-specific realities: Python's **GIL**, Node's event loop, Go's goroutines, Java's virtual threads.

#### Key points
- **Process:** own memory space, isolated; heavier to create; communicate via IPC (pipes, sockets, shared memory). A crash doesn't take down siblings.
- **Thread:** shares memory with other threads in its process; cheaper; scheduled by the OS (preemptive); needs **synchronisation** to avoid races.
- **Async I/O / coroutines:** a single thread (or few) runs an **event loop**; tasks yield at `await` points while waiting for I/O; very cheap; **cooperative** scheduling, so one blocking call stalls everything.
- **I/O-bound** (waiting on DB, network): async or threads give high concurrency.
- **CPU-bound** (image processing, compression, heavy computation): needs **parallelism** across cores: multiple processes (Python), threads (Java/Go/Rust), or offload to workers.
- **Python GIL:** only one thread executes Python bytecode at a time, so threads help I/O-bound work but not CPU-bound pure-Python work (free-threaded builds are changing this, but most deployments still have the GIL).
- Memory per unit: process (MBs) > OS thread (~1 MB stack reserved) > goroutine/virtual thread (KBs) > coroutine (KBs or less).

#### Model answer
"**Concurrency vs parallelism.** Concurrency is about structuring a program to handle many tasks that overlap in time; parallelism is actually running them simultaneously on multiple cores. Async I/O gives concurrency on one core; multiple processes give parallelism.

**Processes:**
- Each has its own address space. Strong isolation: a memory corruption or crash in one doesn't affect others.
- Costly to create and to communicate between (serialisation over IPC).
- Typical use: pre-fork web servers (Gunicorn workers, PHP-FPM), Python multiprocessing for CPU work, isolating untrusted or unstable code.

**Threads:**
- Share the process's memory, so communication is cheap, but shared mutable state needs locks, which brings race conditions and deadlocks.
- The OS scheduler preempts them, so a long computation in one thread doesn't block others.
- Each OS thread has a stack (often 1 MB reserved) and context switches cost microseconds; thousands are fine, hundreds of thousands are not.
- Typical use: thread-per-request servers (classic Java/Tomcat), thread pools for blocking I/O.

**Async I/O (event loop):**
- One thread runs many tasks. When a task awaits I/O (DB query, HTTP call), it yields; the loop runs other tasks and resumes it when the OS signals the I/O is ready (epoll/kqueue/IOCP).
- Very cheap: tens of thousands of concurrent connections on one thread.
- **Cooperative**: a CPU-heavy computation or a blocking call (like `time.sleep` or a synchronous DB driver) inside an async handler freezes *all* tasks.
- Typical use: Node.js, Python asyncio/FastAPI, Netty, high-connection services like websockets and proxies.

**Choosing for a backend service:**
| Workload | Good choice |
|---|---|
| Many concurrent I/O-bound requests (APIs calling DB/other services) | Async I/O, or threads/virtual threads |
| Many long-lived connections (websockets, streaming) | Async I/O or goroutines |
| CPU-bound (image resizing, ML inference, compression) | Multiple processes or threads on multiple cores; offload to worker pool/queue |
| Mixed | Async for I/O + a process/thread pool for CPU work |
| Strong isolation needed | Separate processes/containers |

**Language specifics:**
- **Python:** asyncio for I/O concurrency; threads for blocking libraries; **multiprocessing / ProcessPoolExecutor** for CPU work because of the GIL. Production web servers run multiple worker processes to use all cores.
- **Node.js:** single-threaded event loop for JS; libuv's thread pool handles some blocking operations (file system, DNS, crypto); **worker_threads** or separate processes for CPU-heavy work; cluster mode or multiple containers for cores.
- **Go:** goroutines are cheap (KB stacks) and multiplexed onto OS threads by the runtime; blocking code looks synchronous but scales, and uses all cores.
- **Java:** platform threads historically; **virtual threads** (Java 21+) give goroutine-like cheap threads with blocking-style code.

**Example in Python:**
```python
import asyncio
from concurrent.futures import ProcessPoolExecutor
import httpx

pool = ProcessPoolExecutor()                 # CPU work on all cores

def resize(image_bytes: bytes) -> bytes:     # CPU-bound
    ...

async def handle(url: str) -> bytes:
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)         # I/O: yields to the event loop
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(pool, resize, resp.content)  # don't block the loop
```
"

#### Another worked example: a blocked event loop
"A FastAPI service had p99 latency spikes to 5 seconds under load. The cause: one async endpoint called a synchronous S3 client and a CPU-heavy PDF generator directly inside `async def`, blocking the event loop for every other request. Moving the blocking calls to `run_in_executor` (thread pool for the S3 client, process pool for PDFs) brought p99 back to 200 ms."

#### A third worked example: threads that didn't help
"A Python data pipeline used 16 threads to parse and transform JSON files, but ran no faster than with one thread: the GIL meant only one thread executed Python code at a time. Switching to a `ProcessPoolExecutor` with 8 processes gave a 6× speed-up. The I/O step (downloading files) remained threaded, where threads did help."

#### Variations you might be asked
- "What's a context switch and why is it expensive?": saving/restoring registers and state, plus cache and TLB disruption; process switches cost more than thread switches.
- "What's the C10K problem?": handling 10,000 concurrent connections, solved by non-blocking I/O and event loops instead of a thread per connection.
- "Green threads vs OS threads?": green threads (goroutines, virtual threads) are scheduled by the runtime onto fewer OS threads, making them much cheaper.

#### Step-by-step framework
1. **Define** process, thread, coroutine (memory, scheduling, cost).
2. **Distinguish** concurrency and parallelism.
3. **Classify the workload** (I/O-bound vs CPU-bound).
4. **Pick the model** and mention language constraints.
5. **Call out pitfalls** (blocking the loop, races, GIL).
6. **Give a concrete design** for mixed workloads.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Threads are faster" | Explains when each model fits |
| Confuses concurrency and parallelism | Defines both clearly |
| Ignores the GIL / event loop blocking | Language-specific constraints |
| Async for CPU work | Offloads CPU work to processes/threads |
| No examples | Concrete code and incidents |

#### Useful phrases
- "Async gives me concurrency for I/O; it doesn't give me parallelism for CPU work."
- "One blocking call in an async handler stalls every request on that loop."
- "In Python, CPU-bound work goes to processes because of the GIL."
- "Goroutines and virtual threads make blocking-style code cheap."

#### Common pitfalls
- **Blocking calls in async code.**
- **Threads for CPU-bound Python.**
- **Thread-per-connection** for huge connection counts.
- **Ignoring shared state** when adding threads.

#### Follow-ups to expect (with sample answers)
- **"How many worker processes should a web server run?"**
  "Commonly around the number of CPU cores (or 2 × cores + 1 for sync workers with some I/O), then tuned with load tests."
- **"How does the OS know when I/O is ready?"**
  "Readiness notification mechanisms like epoll (Linux), kqueue (BSD/macOS) or completion ports (Windows)."
- **"Can async be slower than threads?"**
  "For CPU-heavy work or with blocking libraries, yes; and async adds complexity. It shines with many concurrent waits."

#### What senior interviewers look for
- **Accurate mental models** and trade-offs.
- **Diagnosing real production issues** (blocked loops, GIL).
- **Pragmatic designs** combining models.

#### Practise it
1. Explain processes vs threads vs async with a restaurant analogy, out loud.
2. Write an asyncio handler that offloads CPU work to a process pool.
3. Classify five workloads you know as I/O- or CPU-bound and pick a model for each.

## Race conditions, locks and mutexes
- id: be-conc-02
- round: CONCURRENCY
- difficulty: medium
- levels:
- tags: race conditions, locks, mutex, atomics, critical section

### Prompt
What is a race condition? Show an example, then explain how locks, atomic operations and other techniques prevent it. What are the costs of locking?

### Answer
#### What the interviewer is really testing
- Understanding **non-atomic read-modify-write** sequences and interleavings.
- Using **mutexes, atomics, read-write locks** appropriately.
- Recognising races beyond memory: **databases, files, distributed systems** (check-then-act).
- Awareness of **lock costs**: contention, deadlocks, reduced throughput, and alternatives (immutability, message passing).

#### Key points
- A **race condition** occurs when the outcome depends on the timing/interleaving of concurrent operations on shared state.
- Classic example: `count += 1` is **read, add, write**; two threads can both read 5 and both write 6, losing an increment.
- **Check-then-act** races: "if not exists, create" executed concurrently creates duplicates.
- **Mutex/lock:** only one thread enters the **critical section** at a time. Keep critical sections **small**.
- **Atomic operations** (compare-and-swap, atomic increment) avoid locks for simple updates.
- **Read-write locks:** many readers or one writer.
- **Alternatives:** immutability, thread confinement, message passing (actors, channels), database constraints and transactions.
- Costs: **contention**, context switches, **deadlocks**, priority inversion, harder reasoning.

#### Model answer
"**A race condition** is when correctness depends on the relative timing of concurrent operations on shared data. The most common shape is a read-modify-write that isn't atomic.

**Example:**
```python
import threading

count = 0

def worker():
    global count
    for _ in range(100_000):
        count += 1          # read count, add 1, write back — not atomic

threads = [threading.Thread(target=worker) for _ in range(8)]
for t in threads: t.start()
for t in threads: t.join()
print(count)                 # expected 800,000; can be less
```
Interleaving that loses an update:
```
Thread A: read count (5)
Thread B: read count (5)
Thread A: write 6
Thread B: write 6        <- A's increment is lost
```
(Even in Python with the GIL, `+=` on a global isn't guaranteed atomic: a thread switch can happen between the bytecodes.)

**Fix 1: a mutex.**
```python
lock = threading.Lock()

def worker():
    global count
    for _ in range(100_000):
        with lock:          # critical section: one thread at a time
            count += 1
```
Correct, but every increment acquires the lock, so threads serialise. Better to minimise work under the lock, or batch: accumulate locally and add once under the lock at the end.

**Fix 2: atomic operations.** In Java, `AtomicLong.incrementAndGet()`; in Go, `atomic.AddInt64`; in C++, `std::atomic`. These use CPU instructions like **compare-and-swap (CAS)**: 'set the value to new only if it's still old; otherwise retry'. Lock-free and fast for simple updates.

**Fix 3: avoid shared mutable state.**
- **Thread confinement:** each thread has its own counter; combine at the end.
- **Message passing:** send increments to a single owner via a queue/channel (Go's 'share memory by communicating').
- **Immutability:** immutable data can be shared freely.

**Read-write locks.** For data read often and written rarely (e.g. a config cache), a read-write lock allows many concurrent readers but exclusive writers. Watch for writer starvation.

**Races beyond threads (common in backends):**
- **Check-then-act in the database:** two requests both check 'username available?' and both insert. Fix with a **unique constraint** and handle the conflict error, or `INSERT ... ON CONFLICT`.
- **Lost updates:** two requests read a balance, both subtract, both write. Fix with atomic SQL (`UPDATE accounts SET balance = balance - 10 WHERE id = 1 AND balance >= 10`), `SELECT ... FOR UPDATE`, or optimistic locking with a version column.
- **Files:** two processes writing the same file; use atomic rename or file locks.
- **Distributed:** two instances processing the same job; use idempotency, leases or conditional updates.

**Costs of locking:**
- **Contention:** threads wait, reducing parallelism (Amdahl's law: the serial part limits speed-up).
- **Deadlocks** with multiple locks acquired in different orders.
- **Priority inversion** and convoying.
- **Holding locks during I/O** is especially bad: a slow network call under a lock blocks everyone.
- Harder to reason about and test, since races are timing-dependent and intermittent.

**My approach:** first try to avoid shared mutable state; then use the database's atomic operations/constraints for persisted data; then atomics for simple counters; then locks with small critical sections and a consistent ordering."

#### Another worked example: double booking
"A cinema booking API checked `SELECT ... WHERE seat_id = 7 AND status = 'free'`, then updated it to 'booked'. Under a ticket release, two users booked the same seat. We replaced it with a single conditional update: `UPDATE seats SET status='booked', user_id=:u WHERE seat_id=7 AND status='free'`, and checked the affected row count. Zero rows meant someone else got it first: 409 Conflict."

#### A third worked example: lock held during I/O
"A Java service cached auth tokens behind a `synchronized` method that, on cache miss, called the identity provider (200 ms). Under load, all request threads queued on that lock, and throughput collapsed to 5 requests per second. We changed it to compute the token outside the lock, using `ConcurrentHashMap.computeIfAbsent` per key with a short critical section, and added refresh-ahead before expiry."

#### Variations you might be asked
- "What's a data race vs a race condition?": a data race is unsynchronised concurrent access to memory with at least one write (undefined behaviour in some languages); a race condition is a broader logic error depending on timing, which can occur even without data races.
- "What's a spinlock?": a lock that busy-waits instead of sleeping; good for very short critical sections on multi-core systems.
- "What's the ABA problem?": with CAS, a value changes from A to B and back to A, so CAS succeeds despite a change; solved with version counters.

#### Step-by-step framework
1. **Define** race conditions.
2. **Show an interleaving** that breaks correctness.
3. **Fix** with lock, atomic, or redesign.
4. **Extend** to database and distributed races.
5. **Discuss locking costs.**
6. **State your preference order** of techniques.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use a lock" | Explains read-modify-write interleavings |
| Only in-memory races | Database check-then-act and lost updates |
| Big critical sections | Small sections, no I/O under locks |
| Ignores atomics and alternatives | CAS, confinement, message passing |
| No costs mentioned | Contention, deadlocks, Amdahl's law |

#### Useful phrases
- "`count += 1` is three steps: read, add, write."
- "Check-then-act across two queries is a race; I'd make it one atomic statement."
- "Never hold a lock while doing I/O."
- "The best lock is the one you don't need."

#### Common pitfalls
- **Assuming operations are atomic.**
- **Locking reads but not writes** (or vice versa).
- **Using different locks** for the same data.
- **Testing races with a few runs** and declaring them fixed.

#### Follow-ups to expect (with sample answers)
- **"How do you find race conditions?"**
  "Code review for shared state, race detectors (Go's `-race`, ThreadSanitizer), stress tests with many threads, and database constraint violations in logs."
- **"What is a memory barrier / visibility?"**
  "Without synchronisation, one thread may not see another's writes due to caching and reordering; locks and volatile/atomics provide visibility guarantees."
- **"Optimistic vs pessimistic locking?"**
  "Pessimistic locks before updating (`FOR UPDATE`); optimistic detects conflicts at write time with a version check and retries. Optimistic suits low contention."

#### What senior interviewers look for
- **Spotting races in real systems**, especially in the database.
- **Choosing the lightest correct mechanism.**
- **Production experience** with lock contention.

#### Practise it
1. Reproduce the lost-update counter race and fix it three ways.
2. Rewrite a check-then-act SQL flow as a single atomic statement.
3. Explain Amdahl's law and lock contention, out loud.

## Deadlocks: causes and prevention
- id: be-conc-03
- round: CONCURRENCY
- difficulty: medium
- levels:
- tags: deadlock, lock ordering, timeouts, database deadlocks

### Prompt
What is a deadlock? What conditions cause it, and how do you prevent, detect and recover from deadlocks, both in application code and in databases?

### Answer
#### What the interviewer is really testing
- The **four Coffman conditions** and how breaking any one prevents deadlock.
- Practical prevention: **lock ordering**, timeouts, fewer locks, shorter transactions.
- **Database deadlocks**: how they happen, how databases detect them, and how to retry.
- Related problems: **livelock, starvation**, and resource pool deadlocks.

#### Key points
- **Deadlock:** two or more threads/transactions each wait for a resource held by another, so none can proceed.
- **Coffman conditions** (all four required): **mutual exclusion**, **hold and wait**, **no preemption**, **circular wait**.
- Prevention: **consistent global lock ordering** (breaks circular wait), acquire all locks at once or **try-lock with timeout** (breaks hold-and-wait), use fewer/coarser locks, avoid locks.
- **Databases** detect deadlocks (wait-for graph) and abort one transaction as the victim; the app should **retry**.
- Reduce DB deadlocks: access rows in a **consistent order**, keep transactions **short**, use appropriate **indexes** (to lock fewer rows), avoid user interaction inside transactions.
- **Livelock:** threads keep reacting to each other without progress; **starvation:** a thread never gets the resource.
- **Pool deadlocks:** a task waiting for another task in the same exhausted pool, or nested connection acquisition.

#### Model answer
"**Definition.** A deadlock is a cycle of waiting: thread A holds lock 1 and wants lock 2, while thread B holds lock 2 and wants lock 1. Neither can proceed, forever.

**Classic example: transferring money:**
```python
def transfer(src, dst, amount):
    with src.lock:              # A: locks account 1   | B: locks account 2
        with dst.lock:          # A: waits for 2       | B: waits for 1  -> deadlock
            src.balance -= amount
            dst.balance += amount

# Thread A: transfer(acct1, acct2, 10)
# Thread B: transfer(acct2, acct1, 5)
```

**The four Coffman conditions**, all needed for deadlock:
1. **Mutual exclusion:** resources can't be shared.
2. **Hold and wait:** a thread holds one resource while waiting for another.
3. **No preemption:** resources can't be forcibly taken away.
4. **Circular wait:** a cycle exists in the wait-for graph.
Breaking any one prevents deadlocks.

**Prevention in application code:**
- **Global lock ordering** (breaks circular wait), the most practical fix:
```python
def transfer(src, dst, amount):
    first, second = sorted([src, dst], key=lambda a: a.id)   # always lock lower id first
    with first.lock:
        with second.lock:
            src.balance -= amount
            dst.balance += amount
```
- **Try-lock with timeout** (breaks hold and wait): if you can't get the second lock within a timeout, release the first and retry with backoff (add jitter to avoid livelock).
- **Acquire all locks at once** or use a single coarser lock if contention is low.
- **Avoid nested locks**: don't call unknown code (callbacks, other services) while holding a lock.
- **Avoid locks entirely** with message passing or single-owner designs.

**Database deadlocks.** Common scenario:
```
Tx1: UPDATE accounts SET ... WHERE id = 1;   -- locks row 1
Tx2: UPDATE accounts SET ... WHERE id = 2;   -- locks row 2
Tx1: UPDATE accounts SET ... WHERE id = 2;   -- waits for Tx2
Tx2: UPDATE accounts SET ... WHERE id = 1;   -- waits for Tx1 -> deadlock
```
- Databases like PostgreSQL and MySQL periodically build a **wait-for graph**, detect cycles, and **abort one transaction** with a deadlock error (PostgreSQL error 40P01, MySQL 1213).
- The application should **catch and retry** the transaction (with a small backoff), because the victim can usually succeed on retry.
- Prevention:
  - Update rows in a **consistent order** (e.g. sorted by primary key) in all code paths.
  - Keep transactions **short**: no external API calls or user waits inside.
  - Ensure **indexes** on filtered columns, so updates lock only the needed rows rather than scanning and locking more.
  - Use lower isolation or `SELECT ... FOR UPDATE` in a deliberate order; consider `SKIP LOCKED` for job queues.
  - Bulk updates: process in sorted batches.

**Detection and recovery in application code:**
- Thread dumps (Java `jstack`, Python `faulthandler`/py-spy) show threads blocked on locks; JVM can detect monitor deadlocks.
- Timeouts on lock acquisition and on requests turn silent hangs into visible errors.
- Monitoring: requests stuck with zero CPU, thread pools fully busy with no progress.

**Related issues:**
- **Livelock:** two threads repeatedly back off and retry in sync, never progressing; fix with randomised backoff.
- **Starvation:** a thread never acquires a resource because others keep getting it; fix with fair locks/queues.
- **Resource pool deadlock:** each request holds one DB connection and requests a second (e.g. a nested transaction on a new connection); when the pool is exhausted, all wait forever. Fix by not acquiring nested connections, or sizing pools and using timeouts."

#### Another worked example: a production DB deadlock
"An order service saw a few deadlock errors per hour during sales. Two code paths updated `inventory` and `orders` rows in different orders: checkout updated inventory then the order; cancellation updated the order then inventory. We standardised the order (inventory rows sorted by product ID, then the order row), and added automatic retry on deadlock errors up to three times. Errors dropped to near zero, and the rare remaining ones were retried transparently."

#### A third worked example: a thread pool deadlock
"A Java service submitted a task to a fixed 10-thread pool, and each task submitted a subtask to the *same* pool and waited for its result. Under load, all 10 threads were waiting for subtasks that couldn't start because no threads were free: a deadlock with zero CPU. Fixes: separate pools for parent and child tasks, or restructure to avoid blocking waits (use async composition like `CompletableFuture.thenCompose`)."

#### Variations you might be asked
- "Dining philosophers": classic deadlock illustration; fix with ordering (always pick the lower-numbered fork first) or a waiter limiting concurrent diners.
- "Deadlock vs livelock vs starvation": blocked forever vs active without progress vs indefinitely unlucky.
- "How does PostgreSQL choose a deadlock victim?": it detects the cycle after `deadlock_timeout` and aborts the transaction that ran the check; applications must handle the error.

#### Step-by-step framework
1. **Define** deadlock with a two-lock example.
2. **List the four conditions.**
3. **Prevent** by breaking one (ordering, timeouts, fewer locks).
4. **Cover database deadlocks** and retries.
5. **Detection and diagnosis** (thread dumps, DB logs).
6. **Mention livelock, starvation, pool deadlocks.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Vague definition | Two-lock example with timeline |
| Can't name conditions | Coffman conditions and how to break each |
| Only app-level | Database deadlocks, detection, retries |
| "Just add timeouts" | Lock ordering as primary fix |
| No diagnosis | Thread dumps, DB logs, monitoring |

#### Useful phrases
- "Deadlock needs a cycle of waiting; consistent lock ordering removes the cycle."
- "The database will abort one transaction; we should retry it."
- "Never call external services while holding a lock or a transaction open."
- "A task waiting on another task in the same full pool can deadlock."

#### Common pitfalls
- **Inconsistent lock/row ordering** across code paths.
- **Long transactions** with external calls.
- **Not retrying** deadlock victims.
- **Nested pool usage.**

#### Follow-ups to expect (with sample answers)
- **"How do you order locks when you don't know all of them in advance?"**
  "Try-lock with timeout and back off, or restructure to acquire them in a single step; sometimes a coarser lock is simpler."
- **"Can deadlocks happen in distributed systems?"**
  "Yes, with distributed locks or services synchronously waiting on each other in a cycle; timeouts and lease-based locks break them."
- **"How would you test for deadlocks?"**
  "Stress tests with randomised interleavings, timeouts that fail tests instead of hanging, and static analysis of lock ordering."

#### What senior interviewers look for
- **Systematic reasoning** (conditions → prevention).
- **Database deadlock experience.**
- **Diagnosis skills** in production.

#### Practise it
1. Write the deadlocking transfer and fix it with lock ordering.
2. Reproduce a PostgreSQL deadlock with two `psql` sessions, and read the error.
3. Explain the four Coffman conditions, out loud, in 60 seconds.

## Thread pools and worker pools
- id: be-conc-04
- round: CONCURRENCY
- difficulty: medium
- levels:
- tags: thread pool, worker pool, sizing, backpressure, executors

### Prompt
Why use thread pools or worker pools instead of creating a thread per task? How do you size a pool, and what happens when it's saturated?

### Answer
#### What the interviewer is really testing
- Understanding the **cost of threads** and benefits of **reuse and bounding**.
- **Sizing** for CPU-bound vs I/O-bound work (Little's law, utilisation formulas).
- **Queue behaviour** and **saturation policies** (reject, block, caller-runs).
- Isolation with **bulkheads**, and observability (queue depth, wait time).

#### Key points
- Creating a thread per task is expensive (creation cost, memory) and **unbounded**: under load, too many threads exhaust memory and thrash the CPU.
- A **pool** reuses a fixed or bounded set of workers, consuming tasks from a **queue**.
- **CPU-bound sizing:** roughly **number of cores** (maybe +1).
- **I/O-bound sizing:** `threads ≈ cores × (1 + wait time / compute time)`, or via **Little's law**: concurrency = throughput × latency.
- Pools must be sized together with **downstream limits** (DB connection pool size).
- **Bounded queues** + rejection policies give **backpressure**; unbounded queues hide overload until memory or latency explodes.
- **Bulkheads:** separate pools for different dependencies so one slow dependency can't consume all threads.
- Monitor **active threads, queue depth, task wait time, rejections**.

#### Model answer
"**Why pools?**
- Thread creation and teardown cost time and memory; reusing threads amortises that.
- More importantly, a pool **bounds concurrency**. Thread-per-task under a traffic spike can create thousands of threads, causing memory exhaustion, context-switch thrashing, and overwhelming downstream systems (e.g. opening thousands of DB connections).
- Pools give a central place for **queueing, prioritisation, metrics and shutdown**.

**Anatomy:** N worker threads take tasks from a queue. Key parameters: core/max pool size, queue type and capacity, rejection policy, thread naming, and keep-alive.

**Sizing.**
*CPU-bound:* more threads than cores just adds context switching. Start with `cores` (or `cores + 1`).

*I/O-bound:* threads spend most of their time waiting. Use:
`threads ≈ cores × (1 + wait_time / compute_time)`
E.g. 8 cores, each request computes 10 ms and waits 90 ms on I/O → 8 × (1 + 9) = 80 threads.

Or with **Little's law** (L = λ × W): to handle 500 requests/second where each takes 200 ms, you need ~100 concurrent workers.

*Downstream constraints:* if each task needs a DB connection and the DB pool has 20 connections, 100 threads will just queue on the connection pool. Size pools together, and remember the database's total connection limit across all instances.

Finally, **validate with load tests**, watching throughput, latency and CPU as you vary pool size.

**Saturation: what happens when all workers are busy?**
Tasks go into the queue. Choices:
- **Unbounded queue:** never rejects, but under sustained overload the queue grows without limit; latency climbs to minutes and memory runs out. Requests time out on the client side while the server still processes them: wasted work.
- **Bounded queue + rejection policy:**
  - **Reject** (fail fast): return 503/429 quickly so clients back off or retry elsewhere.
  - **Caller-runs:** the submitting thread runs the task itself, naturally slowing the producer (backpressure).
  - **Block the producer** until space is available.
  - **Drop oldest/newest** for non-critical tasks (e.g. metrics).
- I prefer **bounded queues** with explicit overload behaviour and **queue timeouts**: if a task waited longer than the client's timeout, skip it.

**Example in Python:**
```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

def fetch(url: str) -> int:
    return requests.get(url, timeout=5).status_code   # I/O-bound

urls = [...]
with ThreadPoolExecutor(max_workers=32, thread_name_prefix="fetch") as pool:
    futures = {pool.submit(fetch, u): u for u in urls}
    for f in as_completed(futures):
        try:
            print(futures[f], f.result())
        except Exception as e:
            print(futures[f], "failed:", e)
```
(Note: Python's `ThreadPoolExecutor` uses an unbounded queue; for backpressure, wrap submissions with a semaphore.)

**Java example with explicit bounds:**
```java
ExecutorService pool = new ThreadPoolExecutor(
    16, 32, 60, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(500),                  // bounded queue
    new ThreadFactoryBuilder().setNameFormat("orders-%d").build(),
    new ThreadPoolExecutor.CallerRunsPolicy());     // backpressure
```

**Bulkheads.** If the same pool calls both the payments API and the recommendations API, a slow recommendations service can tie up every thread, and payments fail too. Separate pools (or concurrency limits) per dependency contain the damage.

**Operational hygiene:**
- Name threads for debuggable thread dumps.
- Propagate context (trace IDs, request context) into pool tasks.
- **Graceful shutdown:** stop accepting tasks, finish in-flight ones within a deadline.
- Handle exceptions in tasks; uncaught exceptions can silently kill work.
- Metrics: active, queued, completed, rejected, task wait time and run time."

#### Another worked example: an unbounded queue outage
"A notification service used a fixed pool of 20 threads with an unbounded queue to call an email provider. When the provider slowed to 10 seconds per call, the queue grew to 2 million tasks, memory hit the limit and the service crashed, losing every queued notification. Fixes: a durable queue (SQS) instead of in-memory, bounded in-memory buffering, timeouts on provider calls, and a circuit breaker."

#### A third worked example: sizing with load tests
"An API service ran 200 request threads with a DB connection pool of 10. Under load, 190 threads waited on the connection pool, p99 latency hit 3 seconds, and CPU stayed at 20%. Load testing showed the database's sweet spot was ~30 connections per instance. We set the DB pool to 30 and the request thread pool to 60, with a bounded queue and fast 503s beyond that: throughput rose 40% and p99 fell to 400 ms."

#### Variations you might be asked
- "What's work stealing?": idle workers steal tasks from busy workers' queues (Java ForkJoinPool, Go scheduler, Tokio), improving balance for many small tasks.
- "How do virtual threads change pool sizing?": you don't pool virtual threads; create one per task and limit concurrency to downstream resources with semaphores.
- "Should CPU and I/O tasks share a pool?": no; separate pools so blocking I/O doesn't starve CPU tasks and vice versa.

#### Step-by-step framework
1. **Explain why pools** (reuse, bounding, control).
2. **Classify workload** (CPU vs I/O).
3. **Size** with formulas and downstream limits.
4. **Choose queue and saturation policy** (backpressure).
5. **Isolate with bulkheads.**
6. **Observe, load test and shut down gracefully.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Pools are faster" | Bounding concurrency and backpressure |
| Arbitrary pool size | Formulas, Little's law, load tests |
| Unbounded queues | Bounded queues and rejection policies |
| One pool for everything | Bulkheads per dependency |
| Ignores DB pool | Sizes with downstream limits |

#### Useful phrases
- "A pool's most important job is bounding concurrency."
- "For I/O-bound work, size by the wait-to-compute ratio, then load test."
- "An unbounded queue just converts overload into latency and memory exhaustion."
- "Separate pools keep a slow dependency from taking everything down."

#### Common pitfalls
- **Unbounded queues.**
- **Oversized pools** overwhelming the database.
- **Shared pools** across unrelated dependencies.
- **Swallowed task exceptions.**
- **Blocking waits on tasks in the same pool.**

#### Follow-ups to expect (with sample answers)
- **"What's Little's law?"**
  "Average items in a system = arrival rate × average time in the system. It links throughput, latency and the concurrency you need."
- **"How do you know a pool is too small?"**
  "Growing queue depth and wait times while CPU and downstream resources are underused."
- **"How do you shut down a pool safely?"**
  "Stop accepting new tasks, wait for in-flight ones with a timeout, then cancel remaining ones and log them."

#### What senior interviewers look for
- **Quantitative sizing.**
- **Overload behaviour** designed deliberately.
- **Isolation and observability.**

#### Practise it
1. Compute pool sizes for three workloads using the formula and Little's law.
2. Implement a bounded executor in Python with a semaphore.
3. Explain bulkheads with an example, out loud.

## Event loop vs threads (Node.js vs Java/Go)
- id: be-conc-05
- roles: backend, fullstack
- round: CONCURRENCY
- difficulty: medium
- levels:
- tags: event loop, Node.js, goroutines, virtual threads, concurrency models

### Prompt
Compare the concurrency models of Node.js (event loop), traditional Java (thread per request), and Go (goroutines). What are the strengths and pitfalls of each for backend services?

### Answer
#### What the interviewer is really testing
- Understanding **how each runtime schedules work** and handles I/O.
- Knowing the **failure modes** (blocking the event loop, thread exhaustion, goroutine leaks).
- Mapping models to **workloads**.
- Awareness of **modern changes** (Java virtual threads, Node worker threads).

#### Key points
- **Node.js:** single-threaded JavaScript **event loop** with non-blocking I/O via libuv; great for many concurrent I/O operations; **CPU work blocks everything**; use worker threads or separate services for CPU-heavy tasks; multiple processes for cores.
- **Java (classic):** **thread per request** with OS threads; simple blocking code; limited by thread count/memory; reactive frameworks (WebFlux) add event-loop style at a complexity cost.
- **Java 21+ virtual threads:** cheap threads scheduled by the JVM; blocking code scales like async.
- **Go:** **goroutines** (cheap, growable stacks) multiplexed onto OS threads by the runtime scheduler (M:N); blocking-style code scales and uses all cores; **channels** for communication.
- Pitfalls: event loop blocking (Node), thread pool exhaustion (classic Java), **goroutine leaks** and data races (Go), pinning issues (virtual threads in synchronized blocks, improved in later Java versions).

#### Model answer
"**Node.js: event loop.**
- JavaScript runs on **one thread**. I/O operations (network, DB) are non-blocking: Node registers a callback/promise and the event loop keeps processing other events. When the I/O completes, the callback runs.
- libuv uses OS async mechanisms (epoll/kqueue) for network I/O and a small **thread pool** (default 4) for file system, DNS lookups and some crypto.
- **Strengths:** excellent for high-concurrency I/O (APIs aggregating other services, websockets, BFFs); low memory per connection; no shared-memory races in JS code.
- **Pitfalls:**
  - **CPU-heavy work blocks the loop**: a 200 ms JSON parse or bcrypt hash stalls every request. Use `worker_threads`, async crypto APIs, or offload to another service.
  - **Synchronous APIs** (`fs.readFileSync`) in request paths.
  - Uses one core per process: run multiple processes (cluster mode, PM2, or multiple containers).
  - Unhandled promise rejections and callback complexity (mitigated by async/await).
- Monitor **event loop lag**.

```js
// Blocks the event loop for every request:
app.get('/hash', (req, res) => {
  const h = crypto.pbkdf2Sync(req.query.pw, 'salt', 500000, 64, 'sha512');
  res.send(h.toString('hex'));
});
// Better: async version runs on the libuv thread pool
app.get('/hash', (req, res, next) => {
  crypto.pbkdf2(req.query.pw, 'salt', 500000, 64, 'sha512', (err, h) =>
    err ? next(err) : res.send(h.toString('hex')));
});
```

**Classic Java: thread per request.**
- Servers like Tomcat use a thread pool (e.g. 200 threads); each request occupies a thread for its full duration, including while blocked on the DB.
- **Strengths:** simple, readable blocking code; stack traces make sense; true parallelism across cores; mature tooling.
- **Pitfalls:** concurrency limited by threads (~1 MB stack each); slow downstream calls exhaust the pool, and requests queue or fail; shared memory requires careful synchronisation.
- **Reactive Java** (WebFlux/Netty) uses event loops for high concurrency but makes code harder to write and debug.
- **Virtual threads (Java 21+):** the JVM schedules millions of lightweight threads onto a few carrier threads; when a virtual thread blocks on I/O, it unmounts, freeing the carrier. You keep blocking-style code with event-loop-like scalability. Caveats: limit concurrency to downstream resources with semaphores, and watch for pinning (blocking inside `synchronized` or native calls pins the carrier in older versions).

**Go: goroutines and channels.**
- Goroutines start with small stacks (KBs) that grow as needed; the Go runtime's scheduler multiplexes them onto OS threads (one per core by default via GOMAXPROCS) with **work stealing**.
- Blocking I/O in a goroutine parks it; the runtime uses the netpoller (epoll) under the hood.
- **Strengths:** simple synchronous-looking code that scales to hundreds of thousands of concurrent goroutines and uses all cores; channels and `select` for coordination; `context` for cancellation.
- **Pitfalls:**
  - **Goroutine leaks:** goroutines blocked forever on channels or without cancellation, growing memory.
  - **Data races** on shared memory (use `go test -race`, mutexes or channels).
  - Unbounded goroutine creation can overwhelm downstreams; use worker pools or semaphores.

```go
func fetchAll(ctx context.Context, urls []string) []Result {
    results := make([]Result, len(urls))
    sem := make(chan struct{}, 20)            // limit concurrency to 20
    var wg sync.WaitGroup
    for i, u := range urls {
        wg.Add(1)
        go func(i int, u string) {
            defer wg.Done()
            sem <- struct{}{}; defer func() { <-sem }()
            results[i] = fetch(ctx, u)        // ctx cancels on timeout
        }(i, u)
    }
    wg.Wait()
    return results
}
```

**Comparison:**
| Aspect | Node.js | Classic Java | Java virtual threads | Go |
|---|---|---|---|---|
| Code style | Async/await | Blocking | Blocking | Blocking + channels |
| Concurrency per instance | Very high (I/O) | Limited by threads | Very high | Very high |
| Multi-core | Multiple processes | Yes | Yes | Yes |
| CPU-heavy work | Must offload | Fine | Fine | Fine |
| Main pitfall | Blocking the loop | Pool exhaustion | Pinning, unbounded concurrency | Leaks, races |

**Choosing:** Node fits I/O-heavy services and teams sharing JS/TS with the frontend; Java fits large, complex domains with mature ecosystems (now with virtual threads for scale); Go fits network services, infrastructure tools and high-concurrency APIs with simple deployment."

#### Another worked example: event loop lag in Node
"A Node.js API's latency spiked whenever a large report endpoint was called: it serialised a 50 MB JSON response synchronously, blocking the loop for 2 seconds. Event loop lag metrics confirmed it. We streamed the response in chunks and moved report generation to a background worker; p99 for other endpoints returned to normal."

#### A third worked example: a goroutine leak
"A Go service's memory grew steadily over days. A goroutine dump (`pprof`) showed 300,000 goroutines blocked sending on a channel whose reader had returned early on timeout. Fix: buffered channels sized for the result, and `select` with `ctx.Done()` so senders exit when the request is cancelled."

#### Variations you might be asked
- "Is Node.js single-threaded?": JavaScript execution is single-threaded per event loop, but libuv uses threads internally, and worker threads exist.
- "What's the difference between concurrency in Go and parallelism?": goroutines express concurrency; with GOMAXPROCS > 1 they also run in parallel.
- "When would you choose reactive Java over virtual threads?": mostly for existing reactive codebases or streaming backpressure semantics; virtual threads are simpler for new request/response code.

#### Step-by-step framework
1. **Explain each model's scheduling and I/O handling.**
2. **List strengths.**
3. **List pitfalls with examples.**
4. **Compare in a table.**
5. **Match to workloads and teams.**
6. **Mention modern changes.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Node is single-threaded so it's slow" | Explains event loop strengths and limits |
| Ignores CPU work in Node | Worker threads, offloading, loop lag |
| Outdated Java view | Mentions virtual threads |
| "Goroutines are free" | Leaks, races, bounded concurrency |
| No guidance on choice | Matches workloads and teams |

#### Useful phrases
- "In Node, anything CPU-heavy on the main thread blocks every request."
- "Virtual threads keep blocking code but remove the thread-count ceiling."
- "Goroutines are cheap, not free: they leak if nothing cancels them."
- "Whatever the model, concurrency to downstream systems still needs limits."

#### Common pitfalls
- **Sync calls in Node handlers.**
- **Assuming unbounded concurrency is fine.**
- **Ignoring cancellation** (Go context, AbortController).
- **Shared mutable state** in Go/Java without synchronisation.

#### Follow-ups to expect (with sample answers)
- **"How do you measure event loop health?"**
  "Event loop lag/utilisation metrics (e.g. `perf_hooks.monitorEventLoopDelay`) and alerting on sustained lag."
- **"How does Go handle a goroutine making a blocking syscall?"**
  "The runtime hands off the OS thread's other goroutines to another thread so they keep running."
- **"What's the cost of a goroutine vs OS thread?"**
  "Goroutines start at a few KB and are scheduled in user space; OS threads reserve far more memory and switch via the kernel."

#### What senior interviewers look for
- **Deep runtime understanding.**
- **Production debugging** experience.
- **Balanced, workload-based recommendations.**

#### Practise it
1. Explain the Node.js event loop, including the libuv thread pool, out loud.
2. Write a bounded-concurrency fetcher in Go (or your language).
3. Describe one production issue for each model and how you'd detect it.

## Producer-consumer and bounded queues
- id: be-conc-06
- round: CONCURRENCY
- difficulty: medium
- levels:
- tags: producer-consumer, bounded queue, backpressure, condition variables

### Prompt
Implement a producer-consumer system with a bounded queue. Explain why the queue should be bounded, how backpressure works, and how this pattern appears in backend systems.

### Answer
#### What the interviewer is really testing
- Implementing **thread-safe coordination** (locks + condition variables, or built-in blocking queues).
- Understanding **backpressure** and why **unbounded buffers** are dangerous.
- **Graceful shutdown** (poison pills, cancellation) and error handling.
- Mapping the pattern to **message brokers, streaming and pipelines**.

#### Key points
- **Producers** create work; **consumers** process it; a **queue** decouples their speeds.
- **Bounded queue:** when full, producers **block or are rejected**, which slows them down: **backpressure**. When empty, consumers block.
- Implementation: a lock with two **condition variables** (`not_full`, `not_empty`), always waiting in a **while loop** (spurious wakeups); or use built-in blocking queues.
- **Shutdown:** sentinel ("poison pill") per consumer, or a closed flag/channel close.
- Handle consumer **errors** without killing the pipeline; track in-flight work.
- At system scale: Kafka/SQS/RabbitMQ are producer-consumer with persistent queues; **consumer lag** is the key metric.

#### Model answer
"**Why the pattern?** It decouples producers from consumers: they can run at different speeds, scale independently, and absorb bursts.

**Why bounded?** If producers are faster than consumers for a sustained period, an unbounded queue grows until memory runs out, and latency grows with it: items wait longer and longer. A bounded queue forces a decision when full: **block** the producer (backpressure), **reject** (shed load), or **drop** (for non-critical data). That makes overload visible and controlled.

**Implementation with a lock and condition variables** (to show the mechanics):
```python
import threading
from collections import deque

class BoundedQueue:
    def __init__(self, capacity: int):
        self.items = deque()
        self.capacity = capacity
        self.lock = threading.Lock()
        self.not_full = threading.Condition(self.lock)
        self.not_empty = threading.Condition(self.lock)

    def put(self, item, timeout=None) -> bool:
        with self.not_full:
            while len(self.items) >= self.capacity:      # while, not if: spurious wakeups
                if not self.not_full.wait(timeout):
                    return False                          # timed out: caller decides
            self.items.append(item)
            self.not_empty.notify()                       # wake one consumer
            return True

    def get(self):
        with self.not_empty:
            while not self.items:
                self.not_empty.wait()
            item = self.items.popleft()
            self.not_full.notify()                        # wake one producer
            return item
```
- Both conditions share the same lock, so state checks and changes are atomic.
- **`while` instead of `if`**: after waking, another thread may have taken the slot or item; re-check the condition.
- `put` with timeout lets producers shed load rather than block forever.

**Using it** (in practice I'd use `queue.Queue(maxsize=...)`, which implements the same thing):
```python
import queue, threading

STOP = object()                                    # poison pill
q = queue.Queue(maxsize=100)

def producer(items):
    for it in items:
        q.put(it)                                  # blocks when full: backpressure

def consumer(worker_id):
    while True:
        item = q.get()
        try:
            if item is STOP:
                return
            process(item)
        except Exception as e:
            log_error(worker_id, item, e)          # one bad item doesn't kill the worker
        finally:
            q.task_done()

workers = [threading.Thread(target=consumer, args=(i,)) for i in range(4)]
for w in workers: w.start()
producer(load_items())
for _ in workers: q.put(STOP)                      # one pill per consumer
for w in workers: w.join()
```

**Design considerations:**
- **Capacity:** large enough to absorb normal bursts, small enough to bound memory and latency. Little's law helps: at 1,000 items/s with a 2-second acceptable delay, ~2,000 items.
- **Shutdown:** one poison pill per consumer, or close a channel (Go) so consumers drain and exit.
- **Errors:** retry with limits, then send to a **dead letter** list; never let one bad item stop the consumer loop.
- **Ordering:** multiple consumers break global ordering; if needed, partition by key so each key goes to one consumer.
- **Durability:** in-memory queues lose items on crash. If items must survive, use a durable broker.

**In backend systems:**
- **Message brokers** (Kafka, SQS, RabbitMQ) are durable producer-consumer queues between services; **consumer lag** tells you whether consumers keep up.
- **Logging/metrics pipelines** buffer events in bounded in-memory queues and drop or sample when full rather than slowing requests.
- **Web servers** have accept queues and request queues; when full, they reject with 503.
- **Streaming frameworks** (Reactive Streams, Akka Streams, Flink) propagate backpressure upstream.
- **Go channels** are built-in bounded queues: `make(chan Job, 100)`."

#### Another worked example: telemetry without hurting requests
"An API sent analytics events synchronously, adding 30 ms per request and failing requests when the analytics service was down. We moved to an in-process bounded queue (10,000 events) with two background senders batching events. When the queue was full, we dropped events and incremented a `events_dropped` metric, a deliberate choice since analytics were non-critical. Request latency dropped and analytics outages no longer affected users."

#### A third worked example: backpressure in a data pipeline
"An import pipeline read CSV files faster than it could write to the database. With an unbounded queue, memory grew to 20 GB and the process was killed. Changing to a bounded queue of 5,000 rows made the reader block when the writers fell behind; memory stayed under 500 MB, and total throughput was unchanged because the database was always the bottleneck."

#### Variations you might be asked
- "Implement it with semaphores": one semaphore counting empty slots, one counting filled slots, plus a mutex for the buffer.
- "Producer-consumer with asyncio": `asyncio.Queue(maxsize=...)` with `await q.put()` and `await q.get()`.
- "What's the difference between notify and notify_all?": notify wakes one waiter (efficient when any one can proceed); notify_all wakes all (safer when waiters wait for different conditions).
- "How do Kafka consumers apply backpressure?": they pull at their own pace; lag grows instead of overloading consumers.

#### Step-by-step framework
1. **Explain decoupling** and why bounded.
2. **Implement** with lock + conditions (or built-in queue).
3. **Handle shutdown** with poison pills or close.
4. **Handle errors** and dead letters.
5. **Choose capacity** and full-queue policy.
6. **Map to real systems** (brokers, pipelines, metrics).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Unbounded list with a lock | Bounded queue with blocking/rejection |
| `if` around wait | `while` loop for spurious wakeups |
| No shutdown | Poison pill per consumer |
| Consumer dies on exception | Error handling and dead letters |
| Pure threading | Links to Kafka lag, telemetry, streaming |

#### Useful phrases
- "A bounded queue turns overload into backpressure instead of memory exhaustion."
- "I wait in a while loop because the condition might not hold after waking."
- "One poison pill per consumer for clean shutdown."
- "For non-critical events, dropping with a metric is better than slowing requests."

#### Common pitfalls
- **Unbounded buffers.**
- **Busy-waiting** instead of blocking.
- **Single poison pill** for many consumers.
- **Lost items on crash** with in-memory queues for critical data.

#### Follow-ups to expect (with sample answers)
- **"How do you choose the queue size?"**
  "From burst size and acceptable delay (Little's law), then validated with load tests and memory limits."
- **"How do you preserve order with multiple consumers?"**
  "Partition by key into per-consumer queues so each key is processed by one consumer in order."
- **"What metrics would you track?"**
  "Queue depth, enqueue/dequeue rates, wait time, rejected/dropped items, consumer errors."

#### What senior interviewers look for
- **Correct synchronisation** under pressure.
- **Deliberate overload behaviour.**
- **System-level thinking** about pipelines and brokers.

#### Practise it
1. Implement the bounded queue with condition variables and test with fast producers and slow consumers.
2. Rewrite it with `asyncio.Queue` or Go channels.
3. Explain backpressure with a real-world analogy, out loud.

## Implement a thread-safe counter / rate limiter
- id: be-conc-07
- round: CONCURRENCY
- difficulty: medium
- levels:
- tags: rate limiter, token bucket, thread safety, Redis, atomicity

### Prompt
Implement a thread-safe rate limiter that allows each client N requests per second (with some burst). Then explain how you'd make it work across many server instances.

### Answer
#### What the interviewer is really testing
- Knowing **rate limiting algorithms** (token bucket, leaky bucket, fixed window, sliding window) and their trade-offs.
- Writing **thread-safe** code with minimal contention.
- Moving from in-process to **distributed** limiting with **atomic** operations (Redis + Lua).
- Production details: **memory cleanup**, response headers, failure modes (fail open vs closed).

#### Key points
- **Token bucket:** a bucket holds up to `capacity` tokens and refills at `rate` tokens/second; each request takes a token; allows bursts up to capacity. Most common choice.
- **Fixed window counter:** count per time window; simple but allows **2× bursts** at window boundaries.
- **Sliding window log:** store timestamps; precise but memory-heavy.
- **Sliding window counter:** weighted combination of current and previous window counts; good approximation, low memory.
- Thread safety: a lock **per key** (or striped locks), not one global lock; compute refill lazily from elapsed time (no background thread).
- Distributed: **Redis** with a **Lua script** for atomic check-and-update; or local limits per instance (limit / instance count) when approximate is fine.
- Return **429 Too Many Requests** with `Retry-After` and rate limit headers.
- Decide **fail open vs fail closed** when the limiter store is down.

#### Model answer
"I'd clarify: limit per what (user, API key, IP)? Rate and burst size? Single instance or many? Exact or approximate? I'll use a **token bucket**: it allows short bursts while enforcing an average rate, which matches how real clients behave.

**Token bucket with lazy refill.** Instead of a timer adding tokens, compute how many tokens have accumulated since the last request:
```python
import threading
import time

class TokenBucket:
    __slots__ = ("capacity", "rate", "tokens", "updated", "lock")
    def __init__(self, capacity: float, rate: float, now: float):
        self.capacity, self.rate = capacity, rate
        self.tokens, self.updated = capacity, now
        self.lock = threading.Lock()

    def try_acquire(self, now: float, cost: float = 1.0) -> bool:
        with self.lock:
            elapsed = now - self.updated
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.updated = now
            if self.tokens >= cost:
                self.tokens -= cost
                return True
            return False

class RateLimiter:
    def __init__(self, rate: float, burst: float, clock=time.monotonic):
        self.rate, self.burst, self.clock = rate, burst, clock
        self.buckets: dict[str, TokenBucket] = {}
        self.map_lock = threading.Lock()          # protects the dict only

    def allow(self, key: str) -> bool:
        now = self.clock()
        bucket = self.buckets.get(key)
        if bucket is None:
            with self.map_lock:                   # double-checked creation
                bucket = self.buckets.get(key)
                if bucket is None:
                    bucket = TokenBucket(self.burst, self.rate, now)
                    self.buckets[key] = bucket
        return bucket.try_acquire(now)            # per-key lock: no global contention

limiter = RateLimiter(rate=10, burst=20)          # 10 req/s average, bursts of 20
```

**Why this design:**
- **Lazy refill**: O(1) per request, no background threads.
- **Per-bucket locks**: requests for different clients don't contend; the map lock is only taken when creating a new bucket.
- **Monotonic, injectable clock**: correct when wall time jumps, and testable without sleeping.
- **Memory cleanup:** idle buckets accumulate; periodically remove buckets that are full and untouched for a while (e.g. 10 minutes), or use an LRU/TTL map.

**Comparing algorithms:**
| Algorithm | Burst behaviour | Memory | Accuracy |
|---|---|---|---|
| Fixed window | Up to 2× at boundaries | 1 counter | Coarse |
| Sliding window log | Exact | O(requests) | Exact |
| Sliding window counter | Smooth | 2 counters | Approximate |
| Token bucket | Controlled bursts | 2 numbers | Good |
| Leaky bucket (queue) | Smooths output | Queue | Shapes traffic |

**Distributed rate limiting.** With 10 instances behind a load balancer, an in-memory limiter allows 10× the intended rate. Options:
1. **Central store (Redis)** with an atomic Lua script implementing the token bucket:
```lua
-- KEYS[1] = bucket key; ARGV = capacity, rate, now_ms, cost
local b = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local cap, rate, now, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4])
local tokens = tonumber(b[1]) or cap
local ts = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) / 1000 * rate)
local allowed = tokens >= cost
if allowed then tokens = tokens - cost end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return allowed and 1 or 0
```
   The script runs atomically in Redis, so concurrent requests from different instances can't race. One round trip per request (~0.5–1 ms). Use the Redis server's clock or pass a consistent time to avoid skew issues.
2. **Local limits** of `rate / instances`: no network calls, but inaccurate when traffic is unevenly balanced or instances scale.
3. **Hybrid:** local token buckets that periodically sync with a central store, accepting small overshoot.
4. **At the edge:** API gateways (Envoy, Kong, cloud API gateways) often provide this.

**Failure modes:** if Redis is unavailable, do we **fail open** (allow requests, risking overload) or **fail closed** (reject, causing an outage)? For abuse protection on a public API I'd usually fail open with a local fallback limiter; for protecting a fragile downstream, fail closed.

**Response:** return `429` with `Retry-After` and headers like `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` so clients can back off."

#### Another worked example: a thread-safe counter
"A simpler warm-up: a per-endpoint request counter shared across threads. A single global lock around a dict serialised all requests. Using `collections.Counter` per thread (thread-local) and summing on read, or in Java `ConcurrentHashMap<String, LongAdder>`, removed contention: `LongAdder` spreads increments across cells and sums on read, which suits write-heavy counters."

#### A third worked example: boundary bursts with fixed windows
"An API limited clients to 100 requests per minute with fixed windows. A scraper sent 100 requests at 12:00:59 and 100 more at 12:01:00, i.e. 200 in two seconds, overloading a search backend. Switching to a token bucket (rate 100/min, burst 20) smoothed traffic while still allowing normal short bursts."

#### Variations you might be asked
- "Rate limit by multiple dimensions (per user and per IP)?": check several buckets; reject if any is empty (consume tokens only when all allow, or accept slight over-consumption).
- "Different costs per endpoint?": consume more tokens for expensive operations (e.g. search = 5 tokens).
- "Concurrency limiting vs rate limiting?": concurrency limits cap in-flight requests (semaphore), which protects resources better when request durations vary.

#### Step-by-step framework
1. **Clarify** key, rate, burst, scope.
2. **Choose algorithm** (token bucket) and justify.
3. **Implement** with lazy refill and per-key locks.
4. **Handle memory cleanup and clocks.**
5. **Distribute** with Redis Lua or alternatives.
6. **Define failure mode and client responses.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Fixed window without discussion | Compares algorithms, picks token bucket |
| Background thread refilling tokens | Lazy refill from elapsed time |
| One global lock | Per-key locks |
| In-memory only for many instances | Redis + Lua atomic script |
| Ignores failure modes | Fail open vs closed, 429 + headers |

#### Useful phrases
- "Token bucket allows short bursts but enforces the average rate."
- "Refill lazily based on elapsed time; no timers needed."
- "With many instances, the check-and-decrement must be atomic in a shared store."
- "If the limiter's store is down, we need a deliberate fail-open or fail-closed decision."

#### Common pitfalls
- **Non-atomic read-then-write** in Redis (GET then SET).
- **Wall-clock time** causing negative elapsed time.
- **Unbounded bucket maps.**
- **Fixed-window boundary bursts.**

#### Follow-ups to expect (with sample answers)
- **"How do you test it?"**
  "With a fake clock: consume the burst, verify rejection, advance time, verify refill; plus a concurrency test with many threads asserting the total allowed never exceeds the limit."
- **"How do you handle clock skew across instances?"**
  "Use Redis server time (`TIME`) inside the script, or tolerate small skew since refill is computed relative to stored timestamps."
- **"How would you rate limit at very high scale?"**
  "Shard limiter keys across Redis nodes, use local pre-checks to absorb obvious abuse, and accept approximate counting."

#### What senior interviewers look for
- **Correctness under concurrency** and distribution.
- **Trade-off awareness** across algorithms.
- **Operational thinking** (failure modes, headers, cleanup).

#### Practise it
1. Implement the token bucket limiter with a fake clock and tests.
2. Write the Redis Lua script and explain why atomicity matters.
3. Compare fixed window and token bucket with a timeline, out loud.

## Concurrency bugs in production: lost updates and double processing
- id: be-conc-08
- round: CONCURRENCY
- difficulty: hard
- levels: senior
- tags: lost updates, double processing, idempotency, optimistic locking, debugging

### Prompt
Tell me about concurrency bugs you'd expect in a production backend, such as lost updates and jobs being processed twice. How do you detect, reproduce and fix them?

### Answer
#### What the interviewer is really testing
- Familiarity with **real-world concurrency failures** beyond textbook examples.
- Database-level fixes: **atomic updates, optimistic locking, row locks, constraints**.
- Distributed fixes: **idempotency keys, deduplication, leases**, at-least-once delivery realities.
- A methodical approach to **detecting and reproducing** intermittent bugs.

#### Key points
- **Lost update:** two requests read the same row, modify in memory, and write back; one overwrites the other.
- **Double processing:** retries, at-least-once queues, duplicate clicks, or two workers picking the same job.
- **Check-then-act** races: duplicates despite "exists?" checks.
- Fixes for lost updates: **atomic SQL** (`SET x = x + 1`), **optimistic locking** (version column), **pessimistic locking** (`SELECT ... FOR UPDATE`), higher isolation levels.
- Fixes for double processing: **idempotency keys** with unique constraints, **job claiming** with `FOR UPDATE SKIP LOCKED` or conditional updates, **dedup tables**, idempotent side effects.
- **Detection:** invariant checks and reconciliation jobs, constraint violation logs, audit trails, anomalies (negative stock, duplicate charges).
- **Reproduction:** concurrent load tests, injected delays, deterministic interleavings in tests.

#### Model answer
"These bugs are dangerous because they're **intermittent** and often **silent**: tests pass, and production occasionally loses data or charges twice. I think about two families.

**1. Lost updates.**
Example: an inventory service does:
```python
item = db.get(product_id)          # stock = 10
item.stock -= qty                  # both requests compute 9
db.save(item)                      # both write 9; one sale is lost
```
Under concurrency, two orders both read 10 and write 9: we've sold two units but decremented one. Same pattern with ORMs that save whole objects, JSON documents updated by read-modify-write, and counters in caches.

**Fixes, from simplest:**
- **Atomic update in SQL**, letting the database do the read-modify-write:
```sql
UPDATE products SET stock = stock - :qty
WHERE id = :id AND stock >= :qty;     -- 0 rows affected => insufficient stock
```
- **Optimistic locking** when the update logic is complex (computed in application code): add a `version` column:
```sql
UPDATE documents SET body = :new_body, version = version + 1
WHERE id = :id AND version = :expected_version;
-- 0 rows => someone else updated it; reload and retry, or return 409 to the user
```
  Good for low contention and for user-facing edits (e.g. two people editing the same record).
- **Pessimistic locking**: `SELECT ... FOR UPDATE` inside a transaction to lock the row while computing. Good for high contention on a few rows; keep transactions short.
- **Isolation levels**: `SERIALIZABLE` (or MySQL's/PostgreSQL's `REPEATABLE READ` behaviours) detect some conflicts automatically, at the cost of retries.

**2. Double processing.**
Sources:
- **Client retries** after a timeout, when the first request actually succeeded.
- **At-least-once queues** (SQS, Kafka) redeliver messages after a consumer crash or visibility timeout.
- **Two workers** grabbing the same job from a table.
- **Double clicks** on 'Pay'.
- **Scheduled jobs** running on multiple instances.

**Fixes:**
- **Idempotency keys** for APIs: the client sends a unique key per logical operation; the server stores `(key → result)` with a **unique constraint** and returns the stored result on repeats.
```sql
INSERT INTO idempotency_keys (key, request_hash, status) VALUES (:k, :h, 'processing')
ON CONFLICT (key) DO NOTHING;
-- if 0 rows inserted: return the stored response (or 409 if still processing / hash differs)
```
- **Dedup for consumers**: record processed message IDs in the same transaction as the side effect (`processed_messages` with a unique ID), so a redelivery is detected and skipped.
- **Safe job claiming**:
```sql
UPDATE jobs SET status = 'running', worker = :me, started_at = now()
WHERE id = (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1
)
RETURNING *;
```
- **Natural idempotency**: design operations as 'set state to X' rather than 'increment', and use unique constraints on business keys (one payment per order).
- **External side effects** (emails, payment providers): pass the idempotency key downstream (Stripe supports it), use the outbox pattern.

**Detecting these bugs:**
- **Invariant checks and reconciliation**: nightly jobs comparing orders to stock movements, payments to provider records, ledger sums to balances.
- **Constraint violations** in logs are often the first sign of a race (good: the constraint prevented the damage).
- **Audit logs** with request IDs show two writes milliseconds apart.
- **Metrics** on 409s, retries, redeliveries, duplicate keys.

**Reproducing them:**
- Fire concurrent requests at the same resource in a test (`asyncio.gather` of 50 identical requests) and assert invariants.
- **Inject delays** between read and write (a test hook or debugger breakpoint) to widen the race window.
- Simulate redelivery by processing the same message twice in tests.
- Use race detectors for in-memory races (Go `-race`, ThreadSanitizer)."

#### Another worked example: duplicate charges
"After a payment provider timeout, our client library retried the charge request. The first attempt had succeeded, so about 0.05% of customers were charged twice during provider slowness. Fixes: an idempotency key per checkout attempt sent to both our API and the provider; a unique constraint on `(order_id)` in payments; and a reconciliation job comparing our records with the provider daily. Duplicate charges dropped to zero, and the reconciliation job caught one edge case from a manual refund flow."

#### A third worked example: lost updates in a JSON settings document
"User settings were stored as a JSON blob. The mobile and web apps each loaded the blob, changed one field, and saved the whole document. Users saw their settings 'randomly reset'. We added a version column with optimistic locking and changed the API to accept partial updates (`PATCH` with specific fields, using `jsonb_set` in PostgreSQL), so concurrent changes to different fields no longer overwrote each other."

#### Variations you might be asked
- "What isolation level prevents lost updates?": in PostgreSQL, `REPEATABLE READ` aborts one of two concurrent updates to the same row; `READ COMMITTED` does not prevent application-level read-modify-write lost updates.
- "What is write skew?": two transactions read overlapping data and write different rows based on it, violating an invariant (e.g. two doctors both going off call); prevented by `SERIALIZABLE` or explicit locking.
- "How do you make a cron job run once across instances?": leader election, a database lock (advisory lock), or a scheduler service with exactly one runner plus idempotent job logic.

#### Step-by-step framework
1. **Name the bug families** (lost updates, double processing, check-then-act).
2. **Show a concrete failing sequence.**
3. **Fix at the database level** (atomic, optimistic, pessimistic, constraints).
4. **Fix duplicates** with idempotency and safe claiming.
5. **Detect** with invariants, reconciliation, logs.
6. **Reproduce** with concurrent tests and injected delays.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| "Use transactions" | Explains why transactions alone may not prevent lost updates |
| Application-level locks across instances | Database atomics, constraints, SKIP LOCKED |
| Assumes exactly-once delivery | Designs for at-least-once with dedup |
| No detection strategy | Reconciliation and invariant checks |
| Can't reproduce | Concurrent tests with injected delays |

#### Useful phrases
- "Read-modify-write in application code is a lost update waiting to happen."
- "I'd push the update into a single atomic SQL statement."
- "Queues are at-least-once, so every consumer must be idempotent."
- "A reconciliation job is how we find the bugs our tests missed."

#### Common pitfalls
- **ORM saves of whole objects.**
- **Check-then-insert without a unique constraint.**
- **Retrying non-idempotent requests.**
- **Relying on in-memory locks** in multi-instance services.

#### Follow-ups to expect (with sample answers)
- **"Optimistic or pessimistic locking?"**
  "Optimistic for low contention and user edits; pessimistic for hot rows with frequent conflicts, keeping transactions short."
- **"How long should idempotency keys be stored?"**
  "At least as long as clients might retry (often 24 hours to a few days), with cleanup."
- **"What if the side effect is an external email?"**
  "Record the intent in the database with a unique key (outbox), and have the sender check before sending; accept rare duplicates if the provider lacks idempotency."

#### What senior interviewers look for
- **Real production experience** with these failures.
- **Layered defences**: atomic operations, constraints, idempotency, reconciliation.
- **Methodical debugging** of intermittent issues.

#### Practise it
1. Write a test that fires 50 concurrent stock decrements and fails with naive code, then passes with atomic SQL.
2. Implement an idempotency key table and middleware.
3. Tell a story (real or prepared) of finding a concurrency bug, using STAR, out loud.
