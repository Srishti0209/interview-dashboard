# Backend Engineer — Data Structures & Algorithms

## Big-O and complexity analysis explained
- id: be-dsa-01
- round: DSA_CODING
- difficulty: easy
- levels:
- tags: Big-O, complexity, algorithms, performance

### Prompt
Explain Big-O notation. How do you analyse the time and space complexity of code, and why does it matter in backend engineering?

### Answer
#### What the interviewer is really testing
- Solid grasp of **asymptotic complexity** and common complexity classes.
- Ability to **analyse code** step by step (loops, recursion, data structure operations).
- Understanding **time vs space** trade-offs and **amortised** complexity.
- Connecting complexity to **real backend performance** (databases, APIs, large inputs).

#### Key points
- **Big-O** describes how running time or memory **grows** as input size n grows, ignoring constants and lower-order terms (upper bound, usually worst case).
- Common classes: **O(1)** constant, **O(log n)** logarithmic, **O(n)** linear, **O(n log n)**, **O(n²)** quadratic, **O(2ⁿ)** exponential, **O(n!)** factorial.
- Analyse by counting how operations scale: **sequential** steps add, **nested** loops multiply, **halving** gives log n, recursion via **recurrences** or recursion trees.
- **Space complexity** includes extra data structures and recursion stack.
- **Amortised** analysis: e.g. dynamic array append is O(1) amortised despite occasional O(n) resizes.
- Know data structure costs: hash map O(1) average lookup, balanced tree O(log n), array index O(1), linked list search O(n), heap push/pop O(log n).
- In practice: **constants, memory access patterns, I/O and network** often dominate; measure as well as analyse.

#### Model answer
"**Big-O** describes how an algorithm's cost grows as the input size grows. We drop constants and smaller terms because, for large inputs, the dominant term decides scalability. For example, `3n² + 10n + 5` is **O(n²)**.

**Common complexity classes** (from slowest-growing to fastest-growing):
- **O(1)**: hash map lookup (average), array index.
- **O(log n)**: binary search, balanced tree / B-tree lookups (database indexes).
- **O(n)**: scanning a list once.
- **O(n log n)**: efficient sorting (merge sort, Timsort), many divide-and-conquer algorithms.
- **O(n²)**: nested loops comparing all pairs.
- **O(2ⁿ)**: naive recursive solutions exploring all subsets.

**How I analyse code:**
```python
def has_duplicate(nums):          # n = len(nums)
    seen = set()                  # O(1)
    for x in nums:                # n iterations
        if x in seen:             # O(1) average (hash set)
            return True
        seen.add(x)               # O(1) average
    return False
# Time: O(n). Space: O(n) for the set.
```
versus:
```python
def has_duplicate_naive(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):   # nested loop → ~n²/2 comparisons
            if nums[i] == nums[j]:
                return True
    return False
# Time: O(n²). Space: O(1).
```
This shows a classic **time–space trade-off**: using O(n) extra memory reduces time from O(n²) to O(n).

**Rules of thumb:**
- Sequential steps: **add** (O(n) + O(n) = O(n)).
- Nested loops over the same input: **multiply** (O(n²)).
- Loops that halve the problem: **O(log n)**.
- Recursion: think about the number of calls and work per call (e.g. merge sort: log n levels × O(n) work per level = O(n log n)).
- Include **space** for data structures and the **recursion stack** (a recursion depth of n uses O(n) stack).

**Amortised complexity.** Appending to a dynamic array is usually O(1), but occasionally the array resizes (copying everything, O(n)). Averaged over many appends, it's **O(1) amortised**.

**Why it matters in backend engineering:**
- An O(n²) algorithm on 1,000 items is ~1M operations (fine); on 1M items, it's 10¹² operations (unusable). Data grows, so algorithms that work in testing can fail in production.
- **Database queries** are complexity too: a full table scan is O(n), an index lookup O(log n). An N+1 query pattern is effectively O(n) round trips.
- **Memory**: loading a whole 10 GB file into memory vs streaming it line by line (O(1) extra space).
- Big-O isn't everything: constants, cache locality, I/O and network latency often dominate at realistic sizes, so I **measure** with profiling as well."

#### Another worked example: improving an API endpoint
"An endpoint matched each of 50,000 orders against 50,000 payments by scanning the payment list for every order: O(n²) ≈ 2.5 billion comparisons, taking minutes. Building a hash map of payments by order ID first (O(n)) and then looking up each order (O(1) average) made it O(n), finishing in under a second."

#### A third worked example: space complexity matters
"A report job loaded all 30M rows into memory to compute totals, using 12 GB and crashing containers. Streaming rows with a database cursor and keeping only running totals reduced extra space to O(number of groups), a few megabytes, with the same O(n) time."

#### Variations you might be asked
- "What's the complexity of sorting, and why can't comparison sorts beat O(n log n)?": comparison-based sorting has a lower bound of Ω(n log n) comparisons in the worst case.
- "What's the difference between Big-O, Big-Theta and Big-Omega?": upper bound, tight bound and lower bound respectively; interviews usually use Big-O loosely for the tight worst-case bound.
- "What's the complexity of a hash map in the worst case?": O(n) per operation if many keys collide, though good hashing makes average O(1).

#### Common data structure complexities
| Structure | Access | Search | Insert | Delete |
|---|---|---|---|---|
| Array | O(1) | O(n) | O(n) (middle) | O(n) |
| Dynamic array (append) | O(1) | O(n) | O(1) amortised (end) | O(n) |
| Hash map | — | O(1) avg | O(1) avg | O(1) avg |
| Balanced BST / B-tree | O(log n) | O(log n) | O(log n) | O(log n) |
| Heap | O(1) peek | O(n) | O(log n) | O(log n) (top) |
| Linked list | O(n) | O(n) | O(1) at known node | O(1) at known node |

#### Step-by-step framework
1. **Define n** (and other size variables like m).
2. **Count operations** per loop and nesting.
3. **Account for data structure operation costs.**
4. **Analyse recursion** (calls × work).
5. **State time and space** complexity.
6. **Discuss practical factors** and possible improvements.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Memorised definitions only | Analyses real code step by step |
| Ignores space | States time and space |
| Assumes hash maps are always O(1) | Mentions average vs worst case |
| Pure theory | Connects to databases, APIs, memory limits |
| No trade-offs | Discusses time–space trade-offs |

#### Useful phrases
- "Let n be the number of orders; the outer loop runs n times, and the lookup is O(1) on average, so it's O(n) overall."
- "We trade O(n) memory for a big reduction in time."
- "This is O(1) amortised because resizes are rare."
- "Big-O tells us how it scales, but I'd also profile with realistic data."

#### Common pitfalls
- **Ignoring hidden costs** (e.g. `list.contains` is O(n), string concatenation in loops).
- **Forgetting recursion stack space.**
- **Mixing up multiple variables** (O(n·m) vs O(n²)).
- **Over-optimising** tiny inputs while ignoring I/O.

#### Follow-ups to expect (with sample answers)
- **"What's the complexity of `x in list` vs `x in set` in Python?"**
  "List membership is O(n); set membership is O(1) on average."
- **"How would you analyse a recursive Fibonacci?"**
  "Naive recursion is O(2ⁿ) time due to repeated subproblems; memoisation makes it O(n) time and O(n) space."
- **"Why might an O(n log n) algorithm beat an O(n) one in practice?"**
  "Constants and memory access patterns: for realistic sizes, a cache-friendly O(n log n) can be faster than an O(n) algorithm with large constants."

#### What senior interviewers look for
- **Practical judgement**: knowing when complexity matters and when I/O dominates.
- **Clear communication** of analysis during coding.
- **Designing for growth** in data volumes.

#### Practise it
1. Analyse time and space for five short functions you write yourself (loops, nested loops, binary search, recursion, hash map use).
2. Rewrite an O(n²) solution to O(n) using a hash map.
3. Explain amortised O(1) for dynamic arrays, out loud.

## Hash maps: two-sum and frequency counting
- id: be-dsa-02
- round: DSA_CODING
- difficulty: easy
- levels:
- tags: hash map, two-sum, frequency counting, arrays

### Prompt
Given an array of integers and a target, return the indices of two numbers that add up to the target. Then: how would you find the most common element, or check whether two strings are anagrams? Explain how hash maps make these efficient.

### Answer
#### What the interviewer is really testing
- Recognising when a **hash map turns O(n²) into O(n)**.
- Clean handling of **edge cases** (duplicates, no solution, negative numbers).
- Talking through **brute force first**, then optimising.
- Knowing how hash maps work underneath (hashing, collisions, resizing) and their **worst case**.

#### Key points
- Brute force two-sum checks every pair: **O(n²) time, O(1) space**.
- One-pass hash map: for each number, check whether `target - x` was already seen: **O(n) time, O(n) space**.
- **Frequency counting** (Counter / dictionary of counts) solves anagrams, majority element, most frequent item, duplicates, etc.
- Hash maps give **O(1) average** insert/lookup; worst case O(n) with many collisions.
- If the array is **sorted**, two pointers give O(n) time and O(1) space.
- Clarify: return indices or values? Can the same element be used twice? Multiple answers?

#### Model answer
"I'd start by clarifying: exactly one solution? Can I use the same element twice? (Usually no.) Are there negatives or duplicates? Return indices.

**Brute force:** two nested loops checking every pair: O(n²). Fine for 100 items, too slow for 1 million.

**Optimised with a hash map.** The insight: for each number `x`, I need to know if its **complement** `target - x` appeared earlier. A hash map from value to index answers that in O(1).

```python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}            # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:                 # O(1) average
            return [seen[need], i]
        seen[x] = i                      # store after checking, so we don't reuse x
    return []                            # or raise, depending on the contract

# two_sum([2, 7, 11, 15], 9) -> [0, 1]
# two_sum([3, 3], 6)         -> [0, 1]  (duplicates work because we check before storing)
```
- **Time:** O(n), a single pass. **Space:** O(n) for the map.
- Storing *after* checking prevents using the same element twice, and handles duplicates like `[3, 3]`.

**Frequency counting.** The same tool solves a family of problems:
```python
from collections import Counter

def is_anagram(a: str, b: str) -> bool:
    return len(a) == len(b) and Counter(a) == Counter(b)   # O(n)

def most_common(items):
    counts = Counter(items)
    return counts.most_common(1)[0][0] if counts else None   # O(n)

def first_unique_char(s: str) -> int:
    counts = Counter(s)
    for i, ch in enumerate(s):
        if counts[ch] == 1:
            return i
    return -1
```
Alternatives: sorting both strings for anagrams is O(n log n); a fixed array of 26 counts works for lowercase letters only.

**How hash maps work (if asked).** Keys are hashed to a bucket index. Collisions are handled by chaining or open addressing. When the load factor gets high, the table resizes (O(n), but amortised O(1) per insert). With a poor hash function or adversarial input, many keys land in one bucket and operations degrade towards O(n); that's why languages randomise string hashing.

**Backend relevance.** This pattern is everywhere: joining two datasets in memory by ID, deduplicating events by key, counting requests per user for rate limiting, and detecting the top error messages in logs."

#### Another worked example: reconciling payments
"A nightly job matched bank transactions against internal payments by nested loops: 200k × 200k comparisons, timing out. Building a dictionary keyed by `(amount, reference)` from one side and looking up each record from the other made it O(n), finishing in seconds. Unmatched records on either side became the reconciliation report."

#### A third worked example: subarray sum equals K
"A harder variation: count subarrays summing to `k`. Keep a running prefix sum and a hash map of how many times each prefix sum has occurred. At each position, the number of subarrays ending here with sum k equals `count[prefix - k]`. That's O(n) instead of O(n²), and shows the 'complement lookup' idea generalising beyond pairs."
```python
def subarray_sum(nums, k):
    count = {0: 1}
    prefix = total = 0
    for x in nums:
        prefix += x
        total += count.get(prefix - k, 0)
        count[prefix] = count.get(prefix, 0) + 1
    return total
```

#### Variations you might be asked
- "What if the array is sorted?": two pointers from both ends: O(n) time, O(1) space.
- "Three-sum?": sort, then for each element run two pointers on the rest: O(n²).
- "Group anagrams?": map from sorted string (or letter-count tuple) to a list of words.
- "What if the data doesn't fit in memory?": partition by hash into files (or use a distributed join/shuffle), then process each partition.

#### Step-by-step framework
1. **Clarify** inputs, outputs, duplicates, edge cases.
2. **State brute force** and its complexity.
3. **Identify the lookup** that would speed it up (complement, count).
4. **Code the hash map solution** cleanly.
5. **Test** with normal, duplicate and no-solution cases.
6. **State complexity** and trade-offs.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Jumps to code without clarifying | Clarifies duplicates, reuse, output |
| Only brute force | Brute force → hash map, with reasoning |
| Stores before checking (reuses element) | Checks before storing |
| No testing | Walks through `[3,3]`, no-solution cases |
| "Hash maps are always O(1)" | Average O(1), worst O(n) |

#### Useful phrases
- "For each number, the question is: have I already seen its complement?"
- "That trades O(n) memory for O(n) time instead of O(n²)."
- "I check before inserting so I don't pair an element with itself."
- "Frequency counting turns this into a single pass."

#### Common pitfalls
- **Using the same index twice.**
- **Mixing up returning values vs indices.**
- **Sorting and losing original indices** without tracking them.
- **Forgetting empty input.**

#### Follow-ups to expect (with sample answers)
- **"Can you do it in O(1) space?"**
  "Only by sorting (O(n log n)) and using two pointers, keeping original indices if we need them."
- **"What if there are many pairs; return all?"**
  "Store lists of indices per value, or counts if only values matter; be careful about duplicates."
- **"How would you do this as a streaming problem?"**
  "Maintain the map as numbers arrive and report pairs as complements show up; bound memory with a window if needed."

#### What senior interviewers look for
- **Structured problem solving** and communication.
- **Correctness under edge cases.**
- Connecting the pattern to **real data processing**.

#### Practise it
1. Code two-sum, anagram check and first unique character without looking.
2. Solve subarray-sum-equals-k and explain the prefix-sum trick out loud.
3. Explain how a hash map handles collisions in 60 seconds.

## Implement an LRU cache
- id: be-dsa-03
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: LRU cache, hash map, doubly linked list, design

### Prompt
Design and implement an LRU (least recently used) cache with `get(key)` and `put(key, value)`, both in O(1) time, with a fixed capacity.

### Answer
#### What the interviewer is really testing
- Combining **two data structures** to get O(1) operations.
- Careful **pointer manipulation** without bugs.
- Clean **class design** and handling of edge cases (update existing key, capacity 1).
- Extending to real-world concerns: **thread safety, TTL, memory limits**.

#### Key points
- Need O(1) **lookup** → hash map from key to node.
- Need O(1) **recency ordering** (move to front, evict least recent) → **doubly linked list**.
- Most recent at the head; least recent at the tail. On `get`, move the node to the head. On `put`, insert at the head; if over capacity, evict the tail and delete it from the map.
- **Sentinel (dummy) head and tail** nodes avoid null checks.
- In Python, `OrderedDict` with `move_to_end` and `popitem(last=False)` gives a concise version; interviewers often want the manual version too.
- Real caches add **thread safety, TTLs, size-based eviction**, and metrics.

#### Model answer
"**Why two structures?** A hash map alone gives O(1) lookup but no ordering. A list alone gives ordering but O(n) lookup and removal. Combining a **hash map** (key → node) with a **doubly linked list** (ordered by recency) gives both: the map finds the node, and the doubly linked list removes it from anywhere in O(1) because each node knows its neighbours.

```python
class Node:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        if capacity <= 0:
            raise ValueError("capacity must be positive")
        self.cap = capacity
        self.map: dict = {}
        self.head, self.tail = Node(), Node()   # sentinels
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node: Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev

    def _add_front(self, node: Node) -> None:
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        node = self.map.get(key)
        if node is None:
            return -1
        self._remove(node)
        self._add_front(node)          # mark as most recently used
        return node.val

    def put(self, key, value) -> None:
        node = self.map.get(key)
        if node:                       # update existing
            node.val = value
            self._remove(node)
            self._add_front(node)
            return
        if len(self.map) == self.cap:  # evict least recently used
            lru = self.tail.prev
            self._remove(lru)
            del self.map[lru.key]      # this is why nodes store their key
        node = Node(key, value)
        self.map[key] = node
        self._add_front(node)
```

**Walkthrough** (capacity 2): `put(1,A)`, `put(2,B)` → list: 2,1. `get(1)` → list: 1,2. `put(3,C)` → evict tail (2) → list: 3,1. `get(2)` → -1.

**Design notes:**
- **Sentinels** remove all the 'is this the first/last node?' special cases.
- Nodes store their **key** so eviction can delete the map entry.
- Updating an existing key must also refresh its recency.
- Both operations are **O(1)** time; space is O(capacity).

**Concise version:**
```python
from collections import OrderedDict

class LRUCacheOD:
    def __init__(self, capacity):
        self.cap, self.d = capacity, OrderedDict()
    def get(self, key):
        if key not in self.d:
            return -1
        self.d.move_to_end(key)
        return self.d[key]
    def put(self, key, value):
        self.d[key] = value
        self.d.move_to_end(key)
        if len(self.d) > self.cap:
            self.d.popitem(last=False)
```
I'd mention this but write the manual version if they want to see the mechanics.

**Production considerations:**
- **Thread safety:** wrap operations in a lock, or shard the cache into N segments each with its own lock to reduce contention.
- **TTL:** store an expiry per node; treat expired entries as misses on `get` and optionally sweep in the background.
- **Size-based eviction:** evict by total bytes rather than entry count.
- **Metrics:** hit rate, evictions, size.
- Libraries like Caffeine (Java) use smarter policies (W-TinyLFU) with better hit rates than pure LRU."

#### Another worked example: an in-process cache in front of Redis
"Our API looked up feature flags in Redis on every request (~1 ms each). An in-process LRU cache of 10,000 entries with a 30-second TTL cut Redis calls by 95%. We used a sharded, locked LRU so concurrent requests didn't contend on one lock."

#### A third worked example: LRU's weakness
"A batch job scanning millions of product records once evicted all the hot entries from the LRU cache (cache pollution), so normal traffic suffered until the cache warmed again. Options: a separate cache for the batch job, or an LFU/W-TinyLFU policy that resists one-off scans."

#### Variations you might be asked
- "Implement LFU cache": track frequency per key plus a map from frequency to an ordered list of keys; keep a `min_freq` pointer for O(1) eviction.
- "Make it thread-safe": a lock around get/put (since get also mutates order), or striped locks.
- "How does Redis approximate LRU?": it samples a few keys and evicts the oldest among them, avoiding the memory cost of a full linked list.

#### Step-by-step framework
1. **Clarify** capacity, behaviour on update, return value on miss.
2. **Explain the two-structure design** and why.
3. **Implement helpers** (`_remove`, `_add_front`) first.
4. **Implement get and put**, including updates and eviction.
5. **Walk through an example.**
6. **Discuss complexity and production extensions.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Uses a list with O(n) removal | Hash map + doubly linked list for O(1) |
| Messy null checks | Sentinel nodes |
| Forgets to refresh recency on update | Handles update and recency |
| Can't explain eviction delete | Nodes store keys for map deletion |
| No real-world view | Thread safety, TTL, cache pollution |

#### Useful phrases
- "The map gives O(1) lookup; the doubly linked list gives O(1) reordering."
- "Sentinel nodes remove edge cases."
- "Get is a mutating operation, so it needs the lock too."
- "Pure LRU suffers from scan pollution."

#### Common pitfalls
- **Singly linked list** (can't remove in O(1)).
- **Not deleting the evicted key from the map.**
- **Forgetting that `get` changes order.**
- **Capacity zero** not handled.

#### Follow-ups to expect (with sample answers)
- **"Why doubly and not singly linked?"**
  "To remove a node in O(1) we need its predecessor; doubly linked nodes have it."
- **"How would you add TTL efficiently?"**
  "Lazy expiry on read plus periodic sampling, or a min-heap/timing wheel of expiries for active removal."
- **"How would you test it?"**
  "Unit tests for eviction order, updates, capacity 1, misses, and a randomised test against a simple reference implementation."

#### What senior interviewers look for
- **Bug-free implementation** under time pressure.
- **Clear reasoning** about data structure choice.
- **Production awareness** beyond the algorithm.

#### Practise it
1. Implement the manual LRU cache from scratch in under 20 minutes.
2. Add TTL support and explain lazy vs active expiry.
3. Sketch an LFU cache design, out loud.

## Top-K frequent elements with heaps
- id: be-dsa-04
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: heap, priority queue, top-k, bucket sort, streaming

### Prompt
Given a list of items (e.g. search queries or error codes), return the K most frequent. Discuss approaches and their complexity, including a streaming version.

### Answer
#### What the interviewer is really testing
- Knowing **heaps/priority queues** and when they beat sorting.
- Choosing between **sorting, heap, bucket sort and quickselect** based on n and k.
- Extending to **streams** and **distributed data** (approximate counting).
- Clean code and **tie-breaking** decisions.

#### Key points
- Step 1: count frequencies with a hash map: O(n).
- Option A: **sort** unique items by count: O(u log u), where u = unique items.
- Option B: **min-heap of size k**: push each (count, item); pop when size > k: **O(u log k)**. Great when k ≪ u.
- Option C: **bucket sort** by frequency (counts are bounded by n): **O(n)**.
- Option D: **quickselect**: O(u) average.
- Streaming/huge data: **Count-Min Sketch + heap** (approximate), or **Misra–Gries / Space-Saving** algorithms; distributed: count per partition and merge.
- Clarify **ties** and whether results must be ordered.

#### Model answer
"First I'd count: a hash map from item to count, O(n). Then I need the K items with the highest counts.

**Option 1: sort.** Sort the (item, count) pairs by count: O(u log u). Simple and fine for moderate sizes.

**Option 2: min-heap of size k.** Keep the K best seen so far in a min-heap; the smallest of them is on top. For each item, push it; if the heap exceeds k, pop the smallest. At the end the heap holds the top K.

```python
import heapq
from collections import Counter

def top_k_frequent(items, k):
    counts = Counter(items)                   # O(n)
    heap = []                                 # (count, item), min-heap
    for item, c in counts.items():            # u iterations
        heapq.heappush(heap, (c, item))       # O(log k)
        if len(heap) > k:
            heapq.heappop(heap)               # drop the smallest
    return [item for c, item in sorted(heap, reverse=True)]

# Python shortcut: heapq.nlargest(k, counts.items(), key=lambda kv: kv[1])
# or Counter(items).most_common(k)
```
- **Time:** O(n + u log k). **Space:** O(u + k).
- Why a *min*-heap? Because we want to quickly discard the weakest of our current top K.

**Option 3: bucket sort.** A count can't exceed n, so create buckets indexed by count:
```python
def top_k_bucket(items, k):
    counts = Counter(items)
    buckets = [[] for _ in range(len(items) + 1)]
    for item, c in counts.items():
        buckets[c].append(item)
    result = []
    for c in range(len(buckets) - 1, 0, -1):
        for item in buckets[c]:
            result.append(item)
            if len(result) == k:
                return result
    return result
```
- **O(n)** time and space. Excellent when n is moderate.

**Choosing:** for small k and large u, the heap is memory-friendly and fast; for a one-off batch where O(n) memory is fine, bucket sort; if I just need it to work, `most_common(k)`.

**Ties:** I'd ask whether ties need a deterministic order (e.g. alphabetical). With the heap, I can include a tiebreaker in the tuple.

**Streaming and scale:**
- If items arrive continuously and we need 'top queries in the last hour', keep counts in time buckets (e.g. per minute) and combine, or use Redis sorted sets (`ZINCRBY`, `ZREVRANGE 0 k-1`).
- If unique items are too many to count exactly (billions of queries), use a **Count-Min Sketch** for approximate counts plus a heap of candidates, or the **Space-Saving** algorithm, accepting small errors.
- If data is spread across machines, compute counts per partition and **merge counts** before selecting top K. Merging local top-K lists alone can be wrong: an item ranked 11th everywhere might be first globally."

#### Another worked example: top error messages
"For an incident dashboard, we computed the top 10 error signatures in the last 15 minutes. Each service instance kept per-minute counts in Redis hashes; the dashboard summed the last 15 minutes and used a heap for the top 10. Response time stayed under 100 ms even with 50,000 distinct signatures."

#### A third worked example: K closest points / Kth largest
"The same min-heap-of-size-k pattern solves 'K closest servers by latency' and 'Kth largest element in a stream'. For the Kth largest in a stream, keep a min-heap of size k; the top is the answer, and each new number costs O(log k)."
```python
class KthLargest:
    def __init__(self, k, nums):
        self.k, self.heap = k, []
        for x in nums:
            self.add(x)
    def add(self, x):
        heapq.heappush(self.heap, x)
        if len(self.heap) > self.k:
            heapq.heappop(self.heap)
        return self.heap[0]
```

#### Variations you might be asked
- "Merge K sorted lists": a min-heap of the current head of each list: O(N log k).
- "Median of a data stream": two heaps (max-heap for lower half, min-heap for upper half), balanced.
- "Top K in a distributed system": per-node counts, shuffle by item, merge counts, then select top K.

#### Approaches compared
| Approach | Time | Space | Best when |
|---|---|---|---|
| Sort | O(n + u log u) | O(u) | Simple, small data |
| Min-heap size k | O(n + u log k) | O(u + k) | k ≪ u |
| Bucket sort | O(n) | O(n) | Batch, moderate n |
| Quickselect | O(n) avg | O(u) | Unordered result OK |
| Count-Min + heap | ~O(n log k) | Sublinear | Huge streams, approximate OK |

#### Step-by-step framework
1. **Clarify** ties, ordering, data size, streaming.
2. **Count frequencies.**
3. **Choose the selection method** based on k and u.
4. **Code and test.**
5. **State complexity.**
6. **Discuss streaming and distributed** extensions.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Sorts everything without discussion | Compares sort, heap, bucket sort |
| Uses a max-heap of everything | Min-heap of size k, explains why |
| Ignores ties | Clarifies tie-breaking |
| No scale discussion | Streaming, approximate counts, distributed merge |

#### Useful phrases
- "A min-heap of size k lets me discard the weakest candidate in log k."
- "Counts are bounded by n, so bucket sort gives linear time."
- "Merging local top-K lists can be wrong; we need to merge counts."
- "At massive scale, I'd accept approximate counts with a Count-Min Sketch."

#### Common pitfalls
- **Max-heap of all items** (O(u log u) anyway).
- **Merging top-K lists** across partitions.
- **Comparing incomparable items** in heap tuples on ties (add a tiebreaker).
- **Off-by-one in bucket sizes.**

#### Follow-ups to expect (with sample answers)
- **"What's the complexity of building a heap from n items?"**
  "O(n) with heapify; n individual pushes are O(n log n)."
- **"How would you get top queries per hour continuously?"**
  "Per-minute counters in a sliding window, summed when queried, or Redis sorted sets with expiring keys."
- **"What's the error of a Count-Min Sketch?"**
  "It overestimates counts by at most εN with probability 1−δ, controlled by width and depth."

#### What senior interviewers look for
- **Selecting the right algorithm** for constraints.
- **Scale awareness** and correctness in distributed settings.
- Clean, **tested** code.

#### Practise it
1. Implement heap and bucket-sort versions; test with ties.
2. Implement median of a data stream with two heaps.
3. Explain why merging top-K lists is wrong with a counterexample.

## Merge intervals
- id: be-dsa-05
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: intervals, sorting, scheduling, sweep line

### Prompt
Given a list of intervals (e.g. meeting times or maintenance windows), merge all overlapping intervals. Then: how would you find the minimum number of meeting rooms needed?

### Answer
#### What the interviewer is really testing
- Recognising that **sorting by start time** simplifies interval problems.
- Precise handling of **boundary conditions** (touching intervals, nested intervals).
- Knowing the **sweep line** or **heap** approach for overlap counting.
- Linking to real problems: **scheduling, booking systems, time-range queries**.

#### Key points
- Sort intervals by **start**: O(n log n).
- Walk through: if the current interval **overlaps** the last merged one (`start <= last_end`), extend `last_end = max(last_end, end)`; otherwise start a new merged interval.
- Clarify whether **touching** intervals (`[1,3]` and `[3,5]`) count as overlapping.
- **Meeting rooms:** sort starts and ends separately and sweep (two pointers), or use a **min-heap of end times**: O(n log n).
- **Insert interval** into a sorted list: O(n) without re-sorting.
- Real use: calendars, booking conflicts, merging time ranges for queries, IP range consolidation.

#### Model answer
"I'd clarify: are intervals closed (does `[1,3]` overlap `[3,5]`)? Is the input sorted? Can it be empty? I'll assume closed intervals, so touching ones merge.

**Approach.** Unsorted intervals are hard to merge because any interval might overlap any other. Once sorted by start time, an interval can only overlap the **most recently merged** interval, so one pass suffices.

```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals.sort(key=lambda iv: iv[0])          # O(n log n)
    merged = [intervals[0][:]]
    for start, end in intervals[1:]:
        last = merged[-1]
        if start <= last[1]:                      # overlap (or touching)
            last[1] = max(last[1], end)           # max handles nested intervals
        else:
            merged.append([start, end])
    return merged

# merge([[1,3],[2,6],[8,10],[15,18]]) -> [[1,6],[8,10],[15,18]]
# merge([[1,10],[2,3]])               -> [[1,10]]  (nested)
# merge([[1,3],[3,5]])                -> [[1,5]]   (touching)
```
- **Time:** O(n log n) for sorting; the pass is O(n). **Space:** O(n) for output (plus sorting space).
- The `max` is essential: for nested intervals like `[1,10]` and `[2,3]`, simply taking the new end would shrink the interval.

**Meeting rooms (max overlap).** How many meetings overlap at the busiest moment?

*Heap approach:* sort by start; keep a min-heap of end times of meetings in progress. For each meeting, if the earliest-ending meeting has finished (`heap[0] <= start`), reuse that room (pop). Push the current end. The heap's maximum size is the answer.
```python
import heapq

def min_meeting_rooms(intervals):
    intervals.sort(key=lambda iv: iv[0])
    ends = []
    for start, end in intervals:
        if ends and ends[0] <= start:      # a room has freed up
            heapq.heappop(ends)
        heapq.heappush(ends, end)
    return len(ends)
```
*Sweep line approach:* create events (+1 at start, −1 at end), sort them (ends before starts at the same time if touching meetings don't conflict), and track the running count's maximum.

Here, `[9,10]` and `[10,11]` **don't** conflict, since one ends as the other starts, hence `<=`. That's the boundary question to confirm.

**Backend relevance:**
- **Booking systems:** detect conflicts when a new booking overlaps existing ones. In a database, two ranges overlap when `new_start < existing_end AND new_end > existing_start`; PostgreSQL range types with exclusion constraints can enforce no overlaps.
- **Merging time windows** before querying logs or metrics to avoid duplicate scans.
- **Capacity planning:** maximum concurrent sessions or jobs."

#### Another worked example: a room booking API
"A room booking service checked conflicts in application code and occasionally double-booked under concurrent requests. We moved enforcement to PostgreSQL: a `tstzrange` column with an exclusion constraint `EXCLUDE USING gist (room_id WITH =, during WITH &&)`. Overlapping inserts now fail atomically, and the API returns 409 Conflict."

#### A third worked example: insert interval
"Inserting `[4,8]` into the sorted, non-overlapping list `[[1,2],[3,5],[6,7],[8,10],[12,16]]`: add all intervals ending before 4, merge all intervals that overlap `[4,8]` into `[3,10]`, then add the rest. Result: `[[1,2],[3,10],[12,16]]`, in O(n) without re-sorting."
```python
def insert(intervals, new):
    res, i, n = [], 0, len(intervals)
    while i < n and intervals[i][1] < new[0]:
        res.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= new[1]:
        new = [min(new[0], intervals[i][0]), max(new[1], intervals[i][1])]; i += 1
    res.append(new)
    res.extend(intervals[i:])
    return res
```

#### Variations you might be asked
- "Can a person attend all meetings?": sort and check whether any start < previous end.
- "Free time across employees' calendars": merge all busy intervals, then report the gaps.
- "Interval intersection of two sorted lists": two pointers, advancing whichever interval ends first.
- "Non-overlapping intervals (minimum removals)": greedy by earliest end time.

#### Step-by-step framework
1. **Clarify** boundaries (touching), sorted input, empty input.
2. **Sort by start.**
3. **Single pass**, merging with the last interval.
4. **Handle nested intervals** with max.
5. **Test** edge cases.
6. **Extend** to meeting rooms / booking systems.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Compares all pairs | Sorts first, one pass |
| Forgets nested intervals | Uses max for end |
| Ignores touching boundaries | Clarifies inclusive/exclusive |
| Can't count rooms | Heap or sweep line |
| Pure algorithm | Links to booking conflicts and DB constraints |

#### Useful phrases
- "After sorting by start, an interval can only overlap the last merged one."
- "I take the max end to handle nested intervals."
- "Do touching intervals count as overlapping?"
- "Two ranges overlap when each starts before the other ends."

#### Common pitfalls
- **Not sorting**, or sorting by end for merging.
- **Overwriting end** instead of max.
- **Mutating input** unexpectedly (copy if needed).
- **Wrong tie-break** in sweep lines.

#### Follow-ups to expect (with sample answers)
- **"What if intervals arrive one at a time?"**
  "Keep them in a balanced tree or sorted structure keyed by start; inserting and merging neighbours is O(log n) plus merges."
- **"How do you query 'which intervals contain point X' quickly?"**
  "An interval tree or segment tree, or in a database a GiST index on range types."
- **"What's the overlap condition?"**
  "`a.start < b.end and b.start < a.end` for half-open intervals."

#### What senior interviewers look for
- **Precision with boundaries.**
- **Generalising** the sort-then-sweep pattern.
- **Concurrency-safe** real-world implementations.

#### Practise it
1. Code merge intervals and meeting rooms; test nested and touching cases.
2. Solve 'employee free time' and explain it out loud.
3. Write the SQL overlap condition and the PostgreSQL exclusion constraint.

## Sliding window: longest substring without repeats
- id: be-dsa-06
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: sliding window, two pointers, strings, rate limiting

### Prompt
Find the length of the longest substring without repeating characters. Explain the sliding window technique and where else you'd use it.

### Answer
#### What the interviewer is really testing
- Recognising **sliding window** problems (contiguous subarrays/substrings with a constraint).
- Maintaining **window state** (set, counts, sum) incrementally.
- Correct **pointer movement** and O(n) reasoning.
- Applying windows to real problems like **rate limiting** and **moving averages**.

#### Key points
- Brute force checks all substrings: O(n²)–O(n³).
- **Sliding window:** two pointers `left` and `right`; expand `right`, and when the window violates the constraint, shrink from `left` until valid again.
- Each pointer moves at most n times → **O(n)**.
- State: a **set** or **map of last seen index** (lets `left` jump directly).
- Two types: **variable-size** windows (longest/shortest satisfying a constraint) and **fixed-size** windows (max sum of k consecutive elements).
- Real-world: **sliding window rate limiters**, rolling metrics, streaming aggregations.

#### Model answer
"I'd clarify the character set (ASCII or Unicode?), case sensitivity, and empty-string handling.

**Brute force:** check every substring for uniqueness: O(n²) substrings, too slow for long strings.

**Sliding window idea.** Maintain a window `s[left:right+1]` that has no repeats. Move `right` forward one character at a time. If the new character already appears in the window, move `left` past its previous occurrence. Track the maximum window length.

Using a map of each character's **last seen index**, `left` can jump directly:
```python
def length_of_longest_substring(s: str) -> int:
    last_seen: dict[str, int] = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:   # repeat inside the window
            left = last_seen[ch] + 1                      # jump past it
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best

# "abcabcbb" -> 3 ("abc")
# "bbbbb"    -> 1
# "pwwkew"   -> 3 ("wke")
# ""         -> 0
```
- The check `last_seen[ch] >= left` matters: a character seen *before* the window started isn't a repeat. Example: in `"abba"`, when we reach the final `a`, its last occurrence (index 0) is outside the window (left = 2).
- **Time:** O(n); each character is processed once. **Space:** O(min(n, alphabet size)).

**Walkthrough** for `"pwwkew"`:
| right | ch | left | window | best |
|---|---|---|---|---|
| 0 | p | 0 | p | 1 |
| 1 | w | 0 | pw | 2 |
| 2 | w | 2 | w | 2 |
| 3 | k | 2 | wk | 2 |
| 4 | e | 2 | wke | 3 |
| 5 | w | 3 | kew | 3 |

**General template** (variable window):
```python
left = 0
for right in range(len(arr)):
    add(arr[right])                # expand
    while window_invalid():        # shrink until valid
        remove(arr[left]); left += 1
    update_answer(left, right)
```

**Where else I'd use it:**
- **Minimum window substring** (smallest window containing all characters of a pattern).
- **Longest subarray with sum ≤ k** (non-negative numbers).
- **Fixed windows:** maximum sum of k consecutive values, moving averages.
- **Rate limiting:** 'at most 100 requests in any 60-second window'. A sliding window log keeps request timestamps in a deque and evicts those older than 60 seconds; a sliding window counter approximates with two fixed-window counters."

#### Another worked example: a sliding window rate limiter
"Per-user limit of 100 requests per minute. A fixed-window counter allowed bursts of 200 around minute boundaries. We switched to a sliding window: in Redis, a sorted set per user holds request timestamps; on each request we remove entries older than 60 seconds (`ZREMRANGEBYSCORE`), count (`ZCARD`) and add the new one, atomically in a Lua script."
```python
from collections import deque
import time

class SlidingWindowLimiter:
    def __init__(self, limit, window_s):
        self.limit, self.window, self.hits = limit, window_s, deque()
    def allow(self, now=None):
        now = now or time.monotonic()
        while self.hits and self.hits[0] <= now - self.window:
            self.hits.popleft()                 # shrink the window
        if len(self.hits) < self.limit:
            self.hits.append(now)
            return True
        return False
```

#### A third worked example: moving average latency
"For an alerting system, we computed the 5-minute moving average of latency from per-second samples. A fixed-size window with a running sum (add newest, subtract oldest) made each update O(1) instead of re-summing 300 values every second."

#### Variations you might be asked
- "Longest substring with at most K distinct characters": counts map; shrink while distinct > K.
- "Minimum window substring": counts of needed characters and a 'formed' counter; shrink while valid to find the minimum.
- "Why doesn't sliding window work for sums with negative numbers?": shrinking doesn't necessarily reduce the sum, so the monotonic property breaks; use prefix sums with a hash map instead.

#### Step-by-step framework
1. **Recognise** a contiguous-range problem with a constraint.
2. **Define window state** (set, counts, sum).
3. **Expand right**, **shrink left** while invalid.
4. **Update the answer** at the right moment.
5. **Test** edge cases (empty, all same, repeats outside window).
6. **State O(n)** reasoning.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Checks all substrings | Sliding window in O(n) |
| Misses `last_seen >= left` check | Handles `"abba"` correctly |
| Can't explain complexity | Each pointer moves at most n times |
| No generalisation | Template, rate limiting, moving averages |

#### Useful phrases
- "The window always contains a valid substring; I expand right and shrink left when it breaks."
- "Each index enters and leaves the window once, so it's linear."
- "A character seen before the window started doesn't count as a repeat."
- "This is the same idea as a sliding window rate limiter."

#### Common pitfalls
- **Moving left backwards** (forgetting the `>= left` check).
- **Updating best before fixing the window.**
- **Using sliding windows with negative numbers** for sum constraints.
- **Off-by-one** in window length.

#### Follow-ups to expect (with sample answers)
- **"Can you do it with a set instead of a map?"**
  "Yes: while the new char is in the set, remove `s[left]` and advance left. Still O(n), just more steps."
- **"What about Unicode?"**
  "Iterate over code points (or grapheme clusters if required); a hash map handles any character set."
- **"How would you implement a distributed rate limiter?"**
  "Central store like Redis with atomic Lua scripts, or local token buckets with periodic sync if approximate is acceptable."

#### What senior interviewers look for
- **Pattern recognition** across problems.
- **Precise invariants** and pointer logic.
- **Practical applications** in systems.

#### Practise it
1. Code longest substring without repeats and test `"abba"`, `"pwwkew"`, `""`.
2. Solve minimum window substring using the template.
3. Implement and explain a sliding window rate limiter.

## Graph traversal: BFS/DFS and shortest path
- id: be-dsa-07
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: graphs, BFS, DFS, Dijkstra, shortest path

### Prompt
Explain BFS and DFS. Given a grid or a graph of services, how would you find connected components, detect a cycle, or compute the shortest path (unweighted and weighted)?

### Answer
#### What the interviewer is really testing
- Representing graphs (**adjacency list** vs matrix) and modelling problems as graphs.
- **BFS vs DFS**: mechanics, use cases and complexity.
- **Shortest paths:** BFS for unweighted, **Dijkstra** for non-negative weights.
- Avoiding infinite loops with **visited sets**, and recursion-depth issues.

#### Key points
- **Adjacency list** (dict of node → neighbours) is standard: O(V + E) space.
- **BFS** (queue): explores level by level; finds the **shortest path in unweighted graphs**.
- **DFS** (stack/recursion): goes deep first; good for **connected components, cycle detection, topological sort, path existence**.
- Both are **O(V + E)** time with a visited set.
- **Dijkstra** (min-heap): shortest paths with non-negative weights, **O((V + E) log V)**.
- Negative weights → **Bellman–Ford**; all pairs → Floyd–Warshall.
- Grids are graphs: each cell connects to its 4 (or 8) neighbours.
- Deep recursion can overflow; use an explicit stack for large graphs.

#### Model answer
"**Representation.** I'd use an adjacency list: `graph = {'A': ['B', 'C'], 'B': ['D'], ...}`. It's compact for sparse graphs, which most real graphs (service dependencies, social networks, road maps) are.

**BFS** uses a queue: visit the start, then all its neighbours, then their neighbours. Because it expands in layers, the first time it reaches a node is via the **fewest edges**.
```python
from collections import deque

def shortest_path_unweighted(graph, start, goal):
    queue = deque([start])
    parent = {start: None}                 # doubles as the visited set
    while queue:
        node = queue.popleft()
        if node == goal:
            path = []
            while node is not None:
                path.append(node)
                node = parent[node]
            return path[::-1]
        for nxt in graph.get(node, []):
            if nxt not in parent:
                parent[nxt] = node
                queue.append(nxt)
    return None                            # unreachable
```

**DFS** goes as deep as possible before backtracking. I'd use it for connected components, e.g. counting islands in a grid:
```python
def num_islands(grid: list[list[str]]) -> int:
    rows, cols = len(grid), len(grid[0]) if grid else 0
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                stack = [(r, c)]
                grid[r][c] = "0"                     # mark visited
                while stack:                         # iterative avoids recursion limits
                    i, j = stack.pop()
                    for di, dj in ((1,0),(-1,0),(0,1),(0,-1)):
                        ni, nj = i + di, j + dj
                        if 0 <= ni < rows and 0 <= nj < cols and grid[ni][nj] == "1":
                            grid[ni][nj] = "0"
                            stack.append((ni, nj))
    return count
```
(I'd mention that this mutates the grid; use a visited set if mutation isn't allowed.)

**Cycle detection in a directed graph:** DFS with three colours: unvisited, **in progress** (on the current path) and done. Reaching an in-progress node means a back edge, i.e. a cycle. This detects circular service dependencies or circular imports.

**Weighted shortest path: Dijkstra.** BFS fails when edges have different costs (latency, distance). Dijkstra always expands the node with the smallest known distance, using a min-heap:
```python
import heapq

def dijkstra(graph, start):                  # graph: node -> [(neighbour, weight)]
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist.get(node, float("inf")):
            continue                         # stale entry
        for nxt, w in graph.get(node, []):
            nd = d + w
            if nd < dist.get(nxt, float("inf")):
                dist[nxt] = nd
                heapq.heappush(heap, (nd, nxt))
    return dist
```
- Complexity **O((V + E) log V)**. Requires **non-negative** weights; with negatives use Bellman–Ford (O(V·E)).

**Choosing:**
| Need | Algorithm |
|---|---|
| Shortest path, unweighted | BFS |
| Connected components, path exists | BFS or DFS |
| Cycle detection, topological order | DFS (or Kahn's BFS) |
| Shortest path, non-negative weights | Dijkstra |
| Negative weights | Bellman–Ford |

**Backend relevance:** service dependency graphs (blast radius of an outage = nodes reachable in the reverse graph), permission inheritance, social graph 'degrees of separation', network routing, and crawling."

#### Another worked example: blast radius of a failing service
"To answer 'which services are affected if the auth service goes down?', we built a graph from tracing data (caller → callee), reversed it, and ran BFS from auth. The result, with the hop distance, fed an incident dashboard showing directly and indirectly affected services."

#### A third worked example: shortest path in a grid with obstacles
"For a warehouse robot routing problem, the floor was a grid with blocked cells. BFS from the robot's position gave the fewest moves to a shelf. When moves had different costs (turning was slower), we switched to Dijkstra with state (cell, direction)."

#### Variations you might be asked
- "Rotting oranges / multi-source BFS": put all sources in the queue at time 0 and expand levels.
- "Word ladder": BFS where words are nodes and one-letter changes are edges.
- "Clone a graph": BFS/DFS with a map from original to copy.
- "A* search": Dijkstra plus a heuristic estimate to the goal for faster point-to-point search.

#### Step-by-step framework
1. **Model the problem** as a graph (nodes, edges, weights).
2. **Choose representation** (adjacency list).
3. **Pick the algorithm** for the question.
4. **Track visited** to avoid loops.
5. **Handle disconnected graphs** and unreachable goals.
6. **State complexity** and limits (recursion depth, negative weights).

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Confuses BFS and DFS uses | BFS for unweighted shortest path, DFS for structure |
| Forgets visited set | Tracks visited from the start |
| Uses BFS for weighted graphs | Dijkstra, with the non-negative condition |
| Recursive DFS on huge graphs | Iterative stack to avoid overflow |
| No path reconstruction | Parent map to rebuild the path |

#### Useful phrases
- "BFS explores in layers, so the first time we reach a node is via the fewest edges."
- "I mark nodes visited when I enqueue them, not when I dequeue them, to avoid duplicates."
- "Dijkstra needs non-negative weights."
- "The blast radius is the set of nodes reachable in the reversed dependency graph."

#### Common pitfalls
- **Marking visited on dequeue** (duplicate work, sometimes wrong results).
- **Recursion depth limits.**
- **Dijkstra with negative weights.**
- **Forgetting disconnected components.**

#### Follow-ups to expect (with sample answers)
- **"Time complexity of BFS on a grid?"**
  "O(rows × cols); each cell is visited once and has at most 4 neighbours."
- **"When would you use an adjacency matrix?"**
  "Dense graphs or when constant-time edge lookup matters; it costs O(V²) space."
- **"How would you find shortest paths in a huge graph that doesn't fit on one machine?"**
  "Bidirectional BFS to reduce explored nodes, precomputation (landmarks, contraction hierarchies), or graph processing frameworks."

#### What senior interviewers look for
- **Modelling skill**: seeing graphs in real problems.
- **Correct algorithm choice** with constraints.
- **Robust implementation** (visited, iterative, unreachable).

#### Practise it
1. Code BFS shortest path with path reconstruction, and number of islands.
2. Implement Dijkstra and explain why it fails with negative weights.
3. Detect a cycle in a directed dependency graph with three-colour DFS.

## Topological sort: dependency resolution
- id: be-dsa-08
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: topological sort, graphs, DAG, dependencies, Kahn's algorithm

### Prompt
You're given a list of tasks and their dependencies (e.g. build steps, database migrations, or services to start). Return a valid order to run them, or report that it's impossible because of a cycle.

### Answer
#### What the interviewer is really testing
- Modelling dependencies as a **directed graph** and recognising a **DAG**.
- Implementing **Kahn's algorithm** (BFS with in-degrees) or **DFS post-order**.
- **Cycle detection** and useful error reporting.
- Extensions: **parallel execution levels**, deterministic ordering, real systems (build tools, package managers, schedulers).

#### Key points
- Edge `A → B` means "A must run before B" (B depends on A). Be explicit about direction.
- A valid order exists **only if the graph has no cycles** (a DAG).
- **Kahn's algorithm:** compute in-degrees; queue all nodes with in-degree 0; repeatedly pop a node, append it to the order, and decrement its neighbours' in-degrees, enqueueing any that reach 0. If the order has fewer nodes than the graph, there's a cycle.
- **DFS approach:** post-order traversal, reversed; detect cycles with three colours.
- Both are **O(V + E)**.
- Processing Kahn's algorithm **level by level** gives groups that can run **in parallel**.
- Use a **min-heap** instead of a queue for a deterministic (e.g. alphabetical) order.

#### Model answer
"I'd clarify the input format, for example `deps = {'api': ['db', 'cache'], 'db': [], 'cache': ['db']}` meaning *api depends on db and cache*. I'll convert it into edges pointing from prerequisite to dependent: `db → cache`, `db → api`, `cache → api`. Also: are there tasks with no entry? Should I report the cycle itself?

**Kahn's algorithm.** Intuition: a task with no remaining unmet dependencies can run now. Run it, then 'remove' it, which may free up others.

```python
from collections import deque, defaultdict

def build_order(deps: dict[str, list[str]]) -> list[str]:
    graph = defaultdict(list)          # prerequisite -> dependents
    indegree = defaultdict(int)
    nodes = set(deps)
    for task, prereqs in deps.items():
        for p in prereqs:
            graph[p].append(task)
            indegree[task] += 1
            nodes.add(p)               # prerequisites may not be listed as keys

    queue = deque(sorted(n for n in nodes if indegree[n] == 0))
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    if len(order) != len(nodes):
        stuck = sorted(n for n in nodes if indegree[n] > 0)
        raise ValueError(f"cycle detected among: {stuck}")
    return order

# build_order({'api': ['db', 'cache'], 'db': [], 'cache': ['db']})
# -> ['db', 'cache', 'api']
```
- **Time:** O(V + E). **Space:** O(V + E).
- **Cycle detection comes free:** nodes in a cycle never reach in-degree 0, so they're never output.

**DFS alternative.** Do a DFS; when a node finishes (all its dependents explored), push it onto a list; reverse the list at the end. Use three states (unvisited, visiting, done): meeting a 'visiting' node means a cycle, and the current recursion path *is* the cycle, which is great for error messages like `a → b → c → a`.

```python
def topo_dfs(graph, nodes):
    state, order = {}, []              # state: 1 = visiting, 2 = done
    def visit(n, path):
        if state.get(n) == 1:
            cycle = path[path.index(n):] + [n]
            raise ValueError("cycle: " + " -> ".join(cycle))
        if state.get(n) == 2:
            return
        state[n] = 1
        for m in graph.get(n, []):
            visit(m, path + [m])
        state[n] = 2
        order.append(n)
    for n in sorted(nodes):
        visit(n, [n])
    return order[::-1]
```
(For very large graphs I'd make it iterative to avoid recursion limits.)

**Parallel levels.** If tasks can run concurrently, process Kahn's queue one *level* at a time: all current zero in-degree nodes form a batch that can run in parallel. The number of levels is the critical path length, i.e. the minimum total stages.

**Real-world uses:**
- **Build systems** (Make, Bazel, Gradle) order and parallelise targets.
- **Package managers** install dependencies before dependents.
- **Database migrations** with declared dependencies.
- **Workflow schedulers** (Airflow DAGs), **Terraform** resource creation order, service startup order, spreadsheet recalculation."

#### Another worked example: course schedule
"The classic 'course schedule' problem: 4 courses, prerequisites `[[1,0],[2,0],[3,1],[3,2]]` (to take 1 you need 0). Kahn's algorithm gives `0, 1, 2, 3`. If we add `[0,3]`, there's a cycle `0 → 1 → 3 → 0`, so no valid order exists, and the algorithm outputs fewer than 4 courses."

#### A third worked example: parallel deploy stages
"A platform team deployed 40 microservices sequentially in a hand-maintained order, taking 80 minutes. We encoded dependencies in a file, ran Kahn's algorithm by levels, and got 6 stages; deploying each stage in parallel cut deploy time to 15 minutes. The same check rejected PRs that introduced circular dependencies."
```python
def levels(deps):
    # same graph/indegree setup as build_order
    ...
    stages, current = [], [n for n in nodes if indegree[n] == 0]
    while current:
        stages.append(sorted(current))
        nxt = []
        for node in current:
            for m in graph[node]:
                indegree[m] -= 1
                if indegree[m] == 0:
                    nxt.append(m)
        current = nxt
    return stages
```

#### Variations you might be asked
- "Return all valid orders": backtracking over zero in-degree choices (exponential in the worst case).
- "Alien dictionary": derive character ordering edges from adjacent words, then topological sort.
- "Minimum time to finish all tasks with durations": longest path in the DAG (critical path), computed in topological order.
- "Is the order unique?": yes if the queue never contains more than one node at a time.

#### Step-by-step framework
1. **Clarify edge direction** and input format.
2. **Build the graph** and in-degrees (include nodes only appearing as prerequisites).
3. **Run Kahn's algorithm** (or DFS post-order).
4. **Detect and report cycles.**
5. **Consider determinism and parallel levels.**
6. **State complexity.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Edge direction confused | States direction explicitly |
| Misses nodes only listed as prerequisites | Collects all nodes |
| No cycle handling | Detects cycles and reports involved nodes |
| Single order only | Parallel levels, deterministic ordering |
| Pure algorithm | Links to builds, migrations, Airflow, Terraform |

#### Useful phrases
- "A task with zero unmet dependencies can run now."
- "If fewer nodes come out than went in, there's a cycle."
- "Processing level by level tells me what can run in parallel."
- "With DFS, the current path is the cycle, which makes the error message useful."

#### Common pitfalls
- **Reversed edges** giving reversed order.
- **Forgetting isolated nodes.**
- **Recursive DFS** blowing the stack on big graphs.
- **Non-deterministic output** making tests flaky.

#### Follow-ups to expect (with sample answers)
- **"Why must the graph be acyclic?"**
  "In a cycle, each task waits for another in the cycle, so none can go first."
- **"How would you make the order deterministic?"**
  "Use a min-heap keyed by name or priority instead of a FIFO queue: O((V + E) log V)."
- **"How do you handle a failed task in a parallel run?"**
  "Mark its dependents as blocked, continue independent branches, and report the failed subgraph."

#### What senior interviewers look for
- **Clear modelling** and edge-direction discipline.
- **Useful error reporting.**
- **Operational extensions** like parallelism and failures.

#### Practise it
1. Code Kahn's algorithm and the DFS version; test with a cycle.
2. Compute parallel stages for a 10-service dependency list.
3. Explain how a build tool uses topological sorting, out loud.

## Binary search and its variations
- id: be-dsa-09
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: binary search, sorted arrays, search on answer, boundaries

### Prompt
Implement binary search. Then find the first and last position of a target in a sorted array with duplicates, and explain "binary search on the answer" with an example.

### Answer
#### What the interviewer is really testing
- Writing binary search **without off-by-one bugs**.
- Choosing and sticking to a **loop invariant** (closed `[lo, hi]` or half-open `[lo, hi)`).
- Finding **boundaries** (lower bound / upper bound).
- Applying binary search to **monotonic predicates**, not just arrays.

#### Key points
- Binary search halves the search space each step: **O(log n)** time, O(1) space.
- Requires a **monotonic** property: sorted data, or a yes/no predicate that flips once (false…false, true…true).
- Pick an invariant and keep it: e.g. half-open `[lo, hi)` with `while lo < hi`.
- Compute mid as `lo + (hi - lo) // 2` (avoids overflow in fixed-width languages).
- **Lower bound:** first index with `a[i] >= target`. **Upper bound:** first index with `a[i] > target`. First/last occurrence follow directly.
- **Search on the answer:** binary search over possible answers (capacity, speed, time) using a feasibility check.
- Real-world: database index lookups (B-trees), `git bisect`, finding the first bad deploy, capacity planning.

#### Model answer
"**Basic binary search** on a sorted array, using a closed interval `[lo, hi]`:
```python
def binary_search(a: list[int], target: int) -> int:
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1           # target is to the right
        else:
            hi = mid - 1           # target is to the left
    return -1
```
The invariant: if the target exists, it's within `[lo, hi]`. Each step shrinks the range, so it terminates in O(log n).

**First and last position with duplicates.** A plain binary search returns *some* matching index. To find boundaries, I use a **lower bound** helper with a half-open interval:
```python
def lower_bound(a, target):
    """First index i such that a[i] >= target (len(a) if none)."""
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid               # mid might be the answer; keep it
    return lo

def search_range(a, target):
    first = lower_bound(a, target)
    if first == len(a) or a[first] != target:
        return [-1, -1]
    last = lower_bound(a, target + 1) - 1   # for integers; generally use upper_bound
    return [first, last]

# search_range([5,7,7,8,8,10], 8) -> [3, 4]
# search_range([5,7,7,8,8,10], 6) -> [-1, -1]
```
Python's `bisect_left` and `bisect_right` implement exactly these, and I'd mention them, but writing the logic shows I understand the invariants.

**Binary search on the answer.** Many problems ask for the minimum value that satisfies a condition, where feasibility is **monotonic**: if capacity C works, any larger capacity works too. Then I binary search over the answer range with a feasibility check.

*Example: ship packages within D days.* Packages have weights `w`, must ship in order; what's the minimum ship capacity to finish in D days?
```python
def ship_within_days(weights: list[int], days: int) -> int:
    def feasible(cap):
        needed, load = 1, 0
        for w in weights:
            if load + w > cap:
                needed += 1
                load = 0
            load += w
        return needed <= days

    lo, hi = max(weights), sum(weights)     # answer lies in this range
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid                        # mid works; try smaller
        else:
            lo = mid + 1
    return lo
```
- Time: O(n log(sum(weights))): log of the answer range times an O(n) check.

**Avoiding bugs:**
- Decide closed vs half-open and be consistent with loop condition and updates.
- Make sure each iteration **shrinks** the range (`lo = mid + 1` or `hi = mid`), otherwise infinite loops.
- Test with empty arrays, one element, target smaller/larger than all elements, and all duplicates.

**Backend relevance:**
- **Database indexes** are B-trees, a multi-way generalisation of binary search, which is why indexed lookups are O(log n).
- **`git bisect`** binary searches commit history to find the first bad commit.
- **Finding the breaking point** in load testing: binary search on requests per second for where latency SLO fails.
- Searching sorted log files or time-series by timestamp."

#### Another worked example: finding the first bad deploy
"Error rates rose sometime during a day with 64 deploys. Instead of checking each, we binary searched: roll a canary to deploy 32 and check errors, then 16 or 48, and so on. In 6 steps we found the deploy that introduced the regression, the same logic as `git bisect`."

#### A third worked example: search in a rotated sorted array
"A sorted array rotated at an unknown pivot, e.g. `[4,5,6,7,0,1,2]`. At each mid, one half is always sorted. Check whether the target lies in the sorted half's range; if so search there, otherwise search the other half. Still O(log n)."
```python
def search_rotated(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:                       # left half sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                     # right half sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

#### Variations you might be asked
- "Find a peak element": move towards the larger neighbour; O(log n).
- "Integer square root": binary search on the answer in `[0, x]`.
- "Koko eating bananas / minimum speed": classic search on the answer.
- "Median of two sorted arrays": binary search on partition positions, O(log(min(m, n))).

#### Step-by-step framework
1. **Confirm monotonicity** (sorted or monotonic predicate).
2. **Choose the interval convention** and invariant.
3. **Write the loop** ensuring the range shrinks.
4. **Decide what to return** (index, boundary, answer).
5. **Test edge cases.**
6. **State complexity.**

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Off-by-one errors, infinite loops | Clear invariant, shrinking range |
| Linear scan after finding a match for boundaries | Lower/upper bound in O(log n) |
| Only arrays | Search on the answer with feasibility checks |
| No testing | Empty, single, all-duplicate, out-of-range tests |

#### Useful phrases
- "My invariant is: the answer, if it exists, is in `[lo, hi)`."
- "Feasibility is monotonic, so I can binary search on the answer."
- "`hi = mid` because mid could still be the answer."
- "B-tree indexes are why database lookups are logarithmic."

#### Common pitfalls
- **Mixing conventions** (`while lo <= hi` with `hi = mid`).
- **Linear scanning duplicates** to find boundaries.
- **Wrong answer range** in search on the answer.
- **Non-monotonic predicates.**

#### Follow-ups to expect (with sample answers)
- **"Why `lo + (hi - lo) // 2`?"**
  "In languages with fixed-size integers, `lo + hi` can overflow; Python doesn't overflow but the habit is good."
- **"What's the complexity of search on the answer?"**
  "O(log(range) × cost of feasibility check)."
- **"Can you binary search a linked list?"**
  "Not efficiently; finding the middle is O(n). That's why skip lists add express lanes."

#### What senior interviewers look for
- **Bug-free boundary handling.**
- **Recognising hidden monotonicity.**
- **Practical uses** in debugging and capacity planning.

#### Practise it
1. Write lower bound, upper bound and search range from scratch; test edge cases.
2. Solve ship-within-days and integer square root.
3. Explain `git bisect` as binary search, out loud.

## Trees: traversal and validating a BST
- id: be-dsa-10
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: trees, binary search tree, traversal, recursion

### Prompt
Explain tree traversals (pre-order, in-order, post-order, level-order). Then write a function to check whether a binary tree is a valid binary search tree.

### Answer
#### What the interviewer is really testing
- Comfort with **recursion** and tree structure.
- Knowing the **four traversals** and when each is useful.
- Avoiding the classic BST validation bug (checking only **direct children**).
- Iterative alternatives and **complexity**, including recursion depth.

#### Key points
- **Pre-order** (node, left, right): copying/serialising a tree.
- **In-order** (left, node, right): visits a BST in **sorted order**.
- **Post-order** (left, right, node): deleting a tree, computing sizes/heights, evaluating expressions.
- **Level-order** (BFS with a queue): level-by-level views, shortest depth.
- All traversals are **O(n)** time; space O(h) for recursion (h = height; O(n) worst for skewed trees).
- **Valid BST:** every node must lie within a **range** inherited from ancestors, not just compare with its children.
- Alternative: in-order traversal must be **strictly increasing**.
- Clarify **duplicates** policy.

#### Model answer
"**Node definition:**
```python
class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right
```

**Traversals:**
```python
def preorder(n):  return [n.val] + preorder(n.left) + preorder(n.right) if n else []
def inorder(n):   return inorder(n.left) + [n.val] + inorder(n.right) if n else []
def postorder(n): return postorder(n.left) + postorder(n.right) + [n.val] if n else []

from collections import deque
def level_order(root):
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):          # process one level at a time
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out
```
(The list-concatenation versions are concise but allocate lists; in production I'd pass an accumulator or use iteration.)

**When to use each:**
- In-order on a BST gives sorted values (e.g. range queries).
- Post-order when a node's answer depends on its children (height, size, 'delete folder after its contents').
- Pre-order to serialise structure (with null markers) so the tree can be rebuilt.
- Level-order for 'right side view', minimum depth, or printing by levels.

**Validating a BST.** A BST requires *every* node in the left subtree to be less than the node, and every node in the right subtree to be greater. The common bug is checking only `left.val < node.val < right.val`. This tree passes that check but is invalid:
```
      10
     /  \
    5    15
        /  \
       6    20      <- 6 is in 10's right subtree but less than 10
```
**Correct approach: pass down bounds.**
```python
def is_valid_bst(root) -> bool:
    stack = [(root, float("-inf"), float("inf"))]
    while stack:
        node, low, high = stack.pop()
        if not node:
            continue
        if not (low < node.val < high):        # strict: no duplicates allowed
            return False
        stack.append((node.left, low, node.val))
        stack.append((node.right, node.val, high))
    return True
```
- Each node is checked against the range allowed by all its ancestors.
- I used an explicit stack to avoid recursion depth issues on deep (skewed) trees; the recursive version is equally valid for interviews:
```python
def valid(node, low=float("-inf"), high=float("inf")):
    if not node:
        return True
    if not (low < node.val < high):
        return False
    return valid(node.left, low, node.val) and valid(node.right, node.val, high)
```
- **Time:** O(n). **Space:** O(h).

**Alternative: in-order check.** Do an in-order traversal and ensure each value is strictly greater than the previous one. Same complexity; elegant because it uses the sorted-order property.

**Duplicates:** I'd ask whether duplicates are allowed and on which side (e.g. `left <= node < right`), then adjust comparisons.

**Backend relevance:**
- **Database indexes** use B-trees/B+ trees: balanced, wide trees optimised for disk pages; in-order leaf scans support range queries.
- **File systems and org charts** are trees: post-order for sizes ('du'), pre-order for listing.
- **Parsing:** ASTs for query languages or config, evaluated with post-order traversal.
- Balanced trees (red-black, AVL) power sorted maps (e.g. Java's TreeMap)."

#### Another worked example: directory sizes
"A storage service needed total size per folder. Folders form a tree; a folder's size is its files plus all subfolder sizes, a natural **post-order** computation: compute children first, then sum. On a tree with 2 million nodes, the recursive version hit Python's recursion limit, so we used an iterative post-order with an explicit stack."

#### A third worked example: lowest common ancestor
"In an org chart or a category tree, 'find the lowest common manager of two employees'. For a BST, walk from the root: if both values are smaller go left, if both larger go right, otherwise the current node is the LCA: O(h). For a general binary tree, a post-order recursion returns the node when both sides report a match."
```python
def lca(root, p, q):
    if not root or root is p or root is q:
        return root
    left, right = lca(root.left, p, q), lca(root.right, p, q)
    return root if left and right else left or right
```

#### Variations you might be asked
- "Maximum depth / is the tree balanced?": post-order computing heights.
- "Serialize and deserialize a binary tree": pre-order with null markers, or level-order.
- "Kth smallest in a BST": in-order traversal stopping at k.
- "Convert a sorted array to a balanced BST": pick the middle as root recursively.

#### Traversals summary
| Traversal | Order | Typical use |
|---|---|---|
| Pre-order | Node, L, R | Serialising, copying |
| In-order | L, Node, R | Sorted output of BST |
| Post-order | L, R, Node | Heights, sizes, deletion, evaluation |
| Level-order | By depth | Views, min depth, level grouping |

#### Step-by-step framework
1. **Clarify** tree type, duplicates, size/depth.
2. **Choose traversal** based on what each node needs.
3. **Define the recursive contract** (what does the function return for a subtree?).
4. **Handle base case** (null).
5. **Consider iterative** versions for deep trees.
6. **State complexity** O(n) time, O(h) space.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Compares node only with children | Passes down min/max bounds |
| Can't name traversal uses | Matches traversals to problems |
| Ignores duplicates | Clarifies duplicate policy |
| Ignores recursion depth | Mentions O(h) space and iterative option |

#### Useful phrases
- "Each node must lie within bounds set by all its ancestors."
- "In-order traversal of a valid BST is strictly increasing."
- "Post-order fits when a node's result depends on its children."
- "Space is O(h), which is O(n) for a skewed tree."

#### Common pitfalls
- **Local child comparison** for BST validation.
- **Using `0` or small ints as sentinels** instead of infinities/None.
- **Recursion limits** on deep trees.
- **Not handling empty trees.**

#### Follow-ups to expect (with sample answers)
- **"Why are B-trees used in databases instead of binary trees?"**
  "They're wide and shallow, so each lookup touches few disk pages; binary trees would be too deep."
- **"Can you do in-order traversal in O(1) extra space?"**
  "Yes, Morris traversal temporarily rewires null right pointers."
- **"What's the height of a balanced tree with n nodes?"**
  "O(log n), giving O(log n) operations in balanced BSTs."

#### What senior interviewers look for
- **Correct invariants** and clean recursion.
- **Robustness** for large inputs.
- Linking trees to **indexes and real hierarchies**.

#### Practise it
1. Write all four traversals recursively and level-order iteratively.
2. Validate a BST both with bounds and with in-order; test the tricky tree above.
3. Explain why databases use B+ trees, out loud.

## Tries for prefix search
- id: be-dsa-11
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: trie, prefix tree, autocomplete, strings

### Prompt
Implement a trie supporting `insert`, `search` and `starts_with`. Then extend it to return the top autocomplete suggestions for a prefix. When would you use a trie in a backend system?

### Answer
#### What the interviewer is really testing
- Understanding the **trie** structure and its complexity.
- Clean implementation with **children maps** and end-of-word markers.
- Extending to **autocomplete** with ranking.
- Judging trade-offs vs **hash sets, sorted arrays, database indexes and search engines**.

#### Key points
- A trie stores strings character by character along paths from the root; shared prefixes share nodes.
- `insert`, `search`, `starts_with` are **O(L)** where L = word length, independent of the number of words.
- Each node: children (dict or fixed array) + `is_end` flag (and optional payload like counts).
- **Autocomplete:** walk to the prefix node, then DFS to collect words; for ranking, store counts and keep **top-k per node** for fast queries.
- Memory-heavy; **compressed tries (radix trees)** merge single-child chains.
- Real uses: autocomplete, **IP routing (longest prefix match)**, routers in web frameworks, spell checking, word games.
- Alternatives: database `LIKE 'pre%'` with an index, Elasticsearch completion suggester, sorted array + binary search.

#### Model answer
"**Structure.** Each node has a map from character to child node and a flag marking whether a word ends there. 'car', 'cart' and 'cat' share the path c → a.

```python
class TrieNode:
    __slots__ = ("children", "is_end", "count")
    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.is_end = False
        self.count = 0                       # popularity, for ranking

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str, weight: int = 1) -> None:
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True
        node.count += weight

    def _walk(self, prefix: str):
        node = self.root
        for ch in prefix:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return bool(node and node.is_end)

    def starts_with(self, prefix: str) -> bool:
        return self._walk(prefix) is not None
```
- **Time:** O(L) per operation. **Space:** O(total characters) in the worst case.
- `search('ca')` is False (no word ends there) while `starts_with('ca')` is True: that's why `is_end` exists.

**Autocomplete with ranking.**
*Simple version:* walk to the prefix node, DFS to collect all words below it, and return the top k by count with a heap.
```python
import heapq

def suggest(trie: Trie, prefix: str, k: int = 5) -> list[str]:
    start = trie._walk(prefix)
    if not start:
        return []
    results = []                              # (count, word)
    stack = [(start, prefix)]
    while stack:
        node, word = stack.pop()
        if node.is_end:
            results.append((node.count, word))
        for ch, child in node.children.items():
            stack.append((child, word + ch))
    return [w for c, w in heapq.nlargest(k, results)]
```
This is O(size of subtree), which is slow for short prefixes like 'a' with millions of words below.

*Faster version:* **store the top-k suggestions at each node**, updated on insert (or rebuilt offline). A query becomes O(L + k): walk the prefix, return the cached list. The trade-off is extra memory and more expensive updates, which is fine because suggestion lists are usually rebuilt periodically from query logs.

**Production autocomplete design** (if they go broader):
- Build the trie offline (e.g. hourly) from aggregated search logs with counts, filtering offensive terms.
- Serve from memory in a stateless service, replicated; or shard by first characters.
- Cache popular prefixes at the edge/CDN; debounce requests client-side.
- Alternatives: Elasticsearch completion suggester or Redis sorted sets per prefix (`ZINCRBY`, `ZREVRANGE`) for simpler setups.

**Other backend uses:**
- **IP routing / firewall rules:** longest prefix match on binary IP addresses (radix trees).
- **HTTP routers** in web frameworks match paths like `/users/:id/orders` using radix trees.
- **Spell checking / word games** and **keyword blocklists** (Aho–Corasick extends tries for multi-pattern matching).

**When not to use a trie:** for exact membership, a hash set is simpler and smaller. For prefix search over data in a database, an index with `LIKE 'pre%'` (with the right collation) may be enough."

#### Another worked example: an autocomplete service
"An e-commerce site's product search autocomplete used `LIKE '%term%'` queries on a 5M-row table, taking 800 ms. We built a trie of normalised product names and popular queries with top-10 lists per node, rebuilt every 30 minutes, and served it from memory: p99 latency dropped to 5 ms. Memory was about 1.5 GB, reduced to 600 MB with a radix tree."

#### A third worked example: longest prefix match for routing
"An API gateway routed requests by path prefix (`/api/v1/orders` → orders service, `/api/v1` → legacy). With hundreds of rules, checking each in order was slow and error-prone. A trie over path segments returned the longest matching prefix in O(number of segments)."
```python
def longest_prefix(trie_root, segments):
    node, best = trie_root, None
    for seg in segments:
        node = node.children.get(seg)
        if node is None:
            break
        if node.is_end:
            best = node            # remember the deepest matching rule
    return best
```

#### Variations you might be asked
- "Word search II (find all dictionary words in a grid)": build a trie of words and DFS the grid, pruning when the path isn't a prefix.
- "Delete a word from a trie": unset `is_end` and prune nodes with no children on the way back up.
- "Replace words with their shortest root": walk each word until the first `is_end`.

#### Trie vs alternatives
| Structure | Prefix query | Memory | Notes |
|---|---|---|---|
| Trie | O(L + results) | High | Fast prefix ops |
| Radix tree | O(L + results) | Lower | Compressed paths |
| Sorted array + binary search | O(L log n + results) | Low | Static data |
| Hash set | Not supported | Moderate | Exact lookups only |
| DB index with `LIKE 'pre%'` | O(log n + results) | On disk | Simple, persistent |

#### Step-by-step framework
1. **Clarify** operations, character set, scale, ranking needs.
2. **Design the node** (children, is_end, payload).
3. **Implement insert/search/starts_with.**
4. **Extend for autocomplete** (DFS, then cached top-k).
5. **Discuss memory and alternatives.**
6. **Production design** if asked.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| No end-of-word marker | `is_end` distinguishes prefixes from words |
| DFS entire subtree for every query | Top-k cached per node |
| Ignores memory | Radix trees, sharding |
| Uses a trie for everything | Knows when a hash set or DB index is better |

#### Useful phrases
- "Operations cost O(length of the word), regardless of how many words are stored."
- "I'd cache the top suggestions at each node so queries are O(prefix length)."
- "A radix tree compresses chains of single children."
- "For exact lookups only, a hash set is simpler."

#### Common pitfalls
- **Forgetting `is_end`.**
- **Unbounded DFS** on short prefixes.
- **Not normalising input** (case, accents, whitespace).
- **Huge memory** with fixed 26-element arrays for Unicode data.

#### Follow-ups to expect (with sample answers)
- **"How would you update suggestions in real time?"**
  "Increment counts in a streaming aggregator and rebuild or patch top-k lists periodically; real-time precision is rarely needed."
- **"How do you handle typos?"**
  "Fuzzy matching with edit distance over the trie (bounded DFS) or a search engine's fuzzy suggester."
- **"How would you shard a large trie?"**
  "By prefix ranges (e.g. first one or two characters), routing queries to the right shard."

#### What senior interviewers look for
- **Clean implementation** and complexity reasoning.
- **Performance thinking** for real autocomplete.
- **Judgement** about when a trie is the right tool.

#### Practise it
1. Implement the trie with insert, search, starts_with and delete.
2. Add cached top-3 suggestions per node and test with weighted inserts.
3. Design an autocomplete service end to end, out loud, in 5 minutes.

## Dynamic programming: coin change
- id: be-dsa-12
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: dynamic programming, memoisation, recursion, optimisation

### Prompt
Given coin denominations and an amount, return the fewest coins needed to make that amount (or -1 if impossible). Then count the number of ways to make the amount. Explain how you approach dynamic programming problems in general.

### Answer
#### What the interviewer is really testing
- Recognising **overlapping subproblems** and **optimal substructure**.
- Moving from **recursion → memoisation → bottom-up table**.
- Defining the **state** and **transition** clearly.
- Knowing why **greedy fails** here, and subtle differences (min coins vs number of combinations).

#### Key points
- **Greedy** (always take the largest coin) fails for some coin systems: coins `[1, 3, 4]`, amount 6 → greedy 4+1+1 (3 coins), optimal 3+3 (2 coins).
- **State:** `dp[a]` = fewest coins to make amount `a`.
- **Transition:** `dp[a] = min(dp[a - c] + 1)` over coins `c ≤ a`; base case `dp[0] = 0`.
- **Complexity:** O(amount × number of coins) time, O(amount) space.
- **Counting combinations:** `ways[a] += ways[a - c]`, looping **coins in the outer loop** so different orders aren't double counted.
- General DP recipe: define state, recurrence, base cases, order of computation, then optimise space.
- Real uses: pricing/bundling optimisation, text diffing (edit distance), resource allocation, caching expensive recursive computations.

#### Model answer
"**Why not greedy?** With coins `[1, 3, 4]` and amount 6, greedy picks 4, then 1, then 1: three coins. The optimum is 3 + 3: two coins. So we need to consider all options, efficiently.

**Recursive formulation.** The fewest coins for amount `a` is 1 + the fewest coins for `a - c`, minimised over all coins `c`. Plain recursion recomputes the same amounts many times (exponential), but there are only `amount + 1` distinct subproblems, which is the hallmark of DP.

**Top-down with memoisation:**
```python
from functools import lru_cache

def coin_change_memo(coins: list[int], amount: int) -> int:
    @lru_cache(maxsize=None)
    def best(a: int) -> float:
        if a == 0:
            return 0
        if a < 0:
            return float("inf")
        return min(best(a - c) + 1 for c in coins)
    result = best(amount)
    return -1 if result == float("inf") else result
```
(Recursion depth equals the amount, which can hit limits for large amounts, so I'd prefer bottom-up.)

**Bottom-up:**
```python
def coin_change(coins: list[int], amount: int) -> int:
    INF = amount + 1                      # larger than any possible answer
    dp = [0] + [INF] * amount             # dp[a] = fewest coins for amount a
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] != INF else -1

# coin_change([1, 3, 4], 6) -> 2
# coin_change([2], 3)       -> -1
# coin_change([1], 0)       -> 0
```
- **Time:** O(amount × len(coins)). **Space:** O(amount).

**Table for coins `[1,3,4]`, amount 6:**
| a | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| dp[a] | 0 | 1 | 2 | 1 | 1 | 2 | 2 |

**Counting the number of ways** (combinations, order doesn't matter):
```python
def count_ways(coins: list[int], amount: int) -> int:
    ways = [1] + [0] * amount             # one way to make 0: use no coins
    for c in coins:                       # coins outer: each combination counted once
        for a in range(c, amount + 1):
            ways[a] += ways[a - c]
    return ways[amount]

# count_ways([1, 2, 5], 5) -> 4  (5, 2+2+1, 2+1+1+1, 1+1+1+1+1)
```
If I swapped the loops (amount outer, coins inner), I'd count **permutations** (1+2 and 2+1 separately), a subtle bug worth calling out.

**My general DP approach:**
1. **Brute-force recursion** first: what choices do I make at each step?
2. **Spot repeated subproblems**: what parameters identify a subproblem? That's the **state**.
3. Write the **recurrence** and **base cases**.
4. Add **memoisation** (top-down), or determine a **computation order** and fill a table (bottom-up).
5. **Optimise space** if each state depends only on recent states.
6. If needed, **reconstruct the solution** by storing choices.

**Reconstructing the coins used:** store `choice[a] = c` when `dp[a]` improves, then follow choices back from `amount`.

**Backend relevance.** DP shows up in diffing (edit distance in code review tools), text similarity, optimal batching or packing (knapsack variants for allocating resources within budgets), and more generally the *idea* of memoising expensive repeated computations, which is the same reasoning behind caching."

#### Another worked example: edit distance
"For a 'did you mean?' feature, we computed the edit distance between a search term and candidate words. `dp[i][j]` = edits to convert the first i chars of A into the first j chars of B; transitions are insert, delete or replace. O(m × n) time, and space can be reduced to two rows."
```python
def edit_distance(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i] + [0] * len(b)
        for j in range(1, len(b) + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
        prev = cur
    return prev[-1]
```

#### A third worked example: budget allocation (0/1 knapsack)
"Choosing which background jobs to run in a nightly window of 300 CPU-minutes, each job having a cost and business value, is a 0/1 knapsack: `dp[c]` = best value with capacity c, iterating capacities **downwards** per job so each job is used at most once. O(jobs × capacity)."

#### Variations you might be asked
- "Climbing stairs / Fibonacci": the simplest DP; O(1) space with two variables.
- "Longest increasing subsequence": O(n²) DP or O(n log n) with patience sorting.
- "House robber": `dp[i] = max(dp[i-1], dp[i-2] + value[i])`.
- "Longest common subsequence": 2D table similar to edit distance.

#### Step-by-step framework
1. **Show greedy fails** (or brute force is exponential).
2. **Define the state.**
3. **Write the recurrence and base cases.**
4. **Choose top-down or bottom-up.**
5. **Test** with small inputs and impossible cases.
6. **State complexity** and optimise space.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Greedy solution | Counterexample showing greedy fails |
| Jumps to a table without explanation | State, recurrence, base case explained |
| Exponential recursion | Memoisation or bottom-up |
| Swaps loops in counting | Coins-outer for combinations, explains why |
| No impossible case | Returns -1 correctly |

#### Useful phrases
- "There are only amount + 1 distinct subproblems, so memoisation makes this polynomial."
- "`dp[a]` is the fewest coins to make a."
- "Coins in the outer loop counts combinations; amount outer counts permutations."
- "Each state only depends on earlier amounts, so I fill left to right."

#### Common pitfalls
- **Greedy assumptions.**
- **Wrong base case** (`ways[0] = 1`).
- **Loop order** in counting problems.
- **Recursion depth** in top-down for large inputs.

#### Follow-ups to expect (with sample answers)
- **"What if the amount is huge (10⁹)?"**
  "O(amount) DP is infeasible; look for mathematical structure, use BFS with pruning on smaller ranges, or constrain the problem."
- **"Top-down or bottom-up: which do you prefer?"**
  "Top-down is easier to derive; bottom-up avoids recursion limits and often allows space optimisation."
- **"Is coin change NP-hard?"**
  "The general problem is weakly NP-hard; the DP is pseudo-polynomial: polynomial in the amount's value, not its number of digits."

#### What senior interviewers look for
- **A repeatable method** for DP problems.
- **Clear state definitions** and correctness reasoning.
- **Awareness of subtle bugs** and limits.

#### Practise it
1. Solve coin change top-down and bottom-up; reconstruct the coins used.
2. Solve count-ways and explain the loop order out loud.
3. Solve edit distance with two-row space optimisation.

## Build an in-memory key-value store with TTL
- id: be-dsa-13
- round: DSA_CODING
- difficulty: medium
- levels: senior
- tags: key-value store, TTL, expiry, heap, concurrency, design

### Prompt
Implement an in-memory key-value store with `set(key, value, ttl_seconds=None)`, `get(key)` and `delete(key)`. Expired keys must not be returned. Discuss how to clean up expired keys efficiently, and how you'd make it thread-safe and production-ready.

### Answer
#### What the interviewer is really testing
- Clean **API and class design** in a practical coding round.
- Choosing an **expiry strategy**: lazy, active (heap/timing wheel), or sampling.
- Handling **overwrites** and stale expiry entries correctly.
- **Concurrency**, memory limits, testing with **injectable clocks**, and persistence awareness.

#### Key points
- Store `key → (value, expires_at)` in a hash map: O(1) get/set/delete.
- **Lazy expiry:** on `get`, if expired, delete and return None. Simple, but keys never read stay in memory.
- **Active expiry:** a **min-heap** of `(expires_at, key)` to remove expired keys in order; skip stale heap entries after overwrites (check the current expiry matches).
- **Sampling** (Redis-style): periodically sample random keys with TTLs and delete expired ones.
- Use a **monotonic clock**, and **inject the clock** for testing.
- **Thread safety:** a lock (or striped locks); background cleanup thread.
- Production: memory limits + eviction (LRU), metrics, persistence/replication if needed (or just use Redis).

#### Model answer
"I'd clarify: single process or distributed? Thread-safe? Value types? Behaviour of `set` on an existing key (overwrite and reset TTL?). Memory limit? I'll assume a single process, thread-safe, overwrite resets TTL.

**Core design:** a dict `key → (value, expires_at or None)` plus a min-heap for active expiry.

```python
import heapq
import threading
import time
from typing import Any, Callable, Optional

class TTLStore:
    def __init__(self, clock: Callable[[], float] = time.monotonic):
        self._data: dict[str, tuple[Any, Optional[float]]] = {}
        self._heap: list[tuple[float, str]] = []      # (expires_at, key)
        self._lock = threading.Lock()
        self._clock = clock                           # injectable for tests

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        if ttl is not None and ttl <= 0:
            raise ValueError("ttl must be positive")
        with self._lock:
            expires_at = self._clock() + ttl if ttl is not None else None
            self._data[key] = (value, expires_at)
            if expires_at is not None:
                heapq.heappush(self._heap, (expires_at, key))

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._data.get(key)
            if item is None:
                return None
            value, expires_at = item
            if expires_at is not None and expires_at <= self._clock():
                del self._data[key]                   # lazy expiry
                return None
            return value

    def delete(self, key: str) -> bool:
        with self._lock:
            return self._data.pop(key, None) is not None

    def purge_expired(self, max_items: int = 1000) -> int:
        """Active expiry: remove up to max_items expired keys."""
        removed, now = 0, self._clock()
        with self._lock:
            while self._heap and self._heap[0][0] <= now and removed < max_items:
                expires_at, key = heapq.heappop(self._heap)
                current = self._data.get(key)
                # skip stale heap entries (key overwritten or deleted since)
                if current is not None and current[1] == expires_at:
                    del self._data[key]
                    removed += 1
        return removed
```

**Key design decisions:**
- **Lazy + active expiry together.** Lazy expiry guarantees correctness (expired values are never returned); active expiry reclaims memory for keys nobody reads.
- **Stale heap entries.** If a key is overwritten with a new TTL, its old heap entry remains. Rather than searching the heap (O(n)), I check on pop whether the entry's `expires_at` still matches the stored one, a standard lazy-deletion trick.
- **Bounded purge work** (`max_items`) so cleanup never holds the lock for long; a background thread can call it every 100 ms.
- **Monotonic clock** because wall-clock time can jump backwards (NTP), which could resurrect or prematurely expire keys.
- **Injected clock** makes tests deterministic: a fake clock I can advance manually instead of sleeping.

**Complexity:**
- `get`, `delete`: O(1). `set` with TTL: O(log n) for the heap push.
- `purge_expired`: O(k log n) for k removed entries.
- Memory: the heap can hold stale entries; if overwrites are frequent, periodically rebuild the heap.

**Alternative cleanup strategies:**
- **Redis-style sampling:** every 100 ms, sample 20 keys with TTLs; delete expired ones; repeat if more than 25% were expired. No heap needed, probabilistic memory reclamation.
- **Timing wheel:** buckets by expiry time slot (e.g. per second); O(1) insertion; efficient for huge numbers of timers (used in Kafka and Netty).

**Thread safety and performance:**
- A single lock is simple and correct. Note that `get` can mutate (lazy delete), so it needs the lock too.
- Under high contention, **shard** the store into N segments (by key hash), each with its own lock and heap.
- A daemon thread runs `purge_expired` periodically, with a stop event for clean shutdown.

**Production readiness:**
- **Memory limit** with eviction (e.g. LRU on top), and metrics: size, hit rate, expired count, evictions.
- **Persistence/replication** if data must survive restarts, at which point I'd strongly consider just using **Redis** or Memcached rather than building one.
- Values: store copies or immutable values to avoid callers mutating shared state."

#### Another worked example: testing with a fake clock
"Tests that `sleep(2)` to check expiry are slow and flaky. With an injected clock:"
```python
class FakeClock:
    def __init__(self): self.t = 0.0
    def __call__(self): return self.t
    def advance(self, s): self.t += s

clock = FakeClock()
store = TTLStore(clock=clock)
store.set("session", "abc", ttl=30)
assert store.get("session") == "abc"
clock.advance(31)
assert store.get("session") is None          # lazy expiry
store.set("a", 1, ttl=5); store.set("a", 2, ttl=100)
clock.advance(10)
assert store.purge_expired() == 0            # stale entry skipped
assert store.get("a") == 2
```

#### A third worked example: a memory leak from lazy-only expiry
"A service cached one-time verification codes with lazy expiry only. Most codes were never read again after use or abandonment, so they stayed in memory forever; memory grew 2 GB per week until restarts. Adding an active purge every second (bounded to 5,000 keys per run) stabilised memory at ~150 MB."

#### Variations you might be asked
- "Add `ttl(key)` returning remaining time": compute `expires_at - now`, or -1/None if no TTL or missing.
- "Support transactions (begin/commit/rollback)": keep a stack of change logs or overlay dicts; reads check overlays top-down.
- "Make it time-versioned (get value at timestamp)": map key → sorted list of (timestamp, value), binary search on get.
- "Make it distributed": partition keys with consistent hashing, replicate for availability, decide consistency (or use Redis Cluster).

#### Step-by-step framework
1. **Clarify** semantics (overwrite, TTL reset, thread safety, limits).
2. **Core map** with value and expiry.
3. **Lazy expiry** for correctness.
4. **Active expiry** (heap/sampling/timing wheel) for memory.
5. **Concurrency** (locks, sharding, background thread).
6. **Testing** with injected clocks and production concerns.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| Starts a timer thread per key | Heap, sampling or timing wheel |
| Lazy expiry only | Lazy + active, explains memory leak risk |
| Ignores overwrites in the heap | Skips stale heap entries |
| `time.time()` | Monotonic, injectable clock |
| No locking on get | Notes get mutates; locks or shards |

#### Useful phrases
- "Lazy expiry guarantees correctness; active expiry reclaims memory."
- "I skip stale heap entries by comparing the stored expiry."
- "I inject the clock so tests don't need to sleep."
- "If we need persistence and replication, I'd use Redis instead of building one."

#### Common pitfalls
- **Thread per key timer.**
- **Unbounded purge loops** holding locks.
- **Wall-clock time.**
- **Returning mutable shared values.**

#### Follow-ups to expect (with sample answers)
- **"How does Redis expire keys?"**
  "Lazily on access plus an active cycle that samples keys with TTLs and deletes expired ones, repeating while many are expired."
- **"How would you limit memory?"**
  "Track approximate size, and evict with LRU/LFU when over the limit, preferring keys with TTLs if configured."
- **"What happens to TTLs on restart with persistence?"**
  "Store absolute expiry timestamps (wall-clock) in snapshots, then convert to the monotonic clock on load."

#### What senior interviewers look for
- **Practical engineering judgement** in a coding round.
- **Correctness under edge cases** (overwrites, clocks).
- **Testability and production readiness.**

#### Practise it
1. Implement the store with lazy and active expiry; write tests with a fake clock.
2. Add sharded locks and a background purge thread with clean shutdown.
3. Explain Redis's expiry algorithm and timing wheels, out loud.

## Parse and aggregate log files
- id: be-dsa-14
- round: DSA_CODING
- difficulty: medium
- levels:
- tags: parsing, streaming, aggregation, percentiles, practical coding

### Prompt
You have a large access log (possibly several GB) with lines like `2026-03-01T10:15:32Z GET /api/orders 200 123ms user=42`. Write code to report: requests per endpoint, error rate per endpoint, p95 latency per endpoint, and the top 10 users by request count. Discuss memory, malformed lines, and scaling beyond one machine.

### Answer
#### What the interviewer is really testing
- Practical, **production-quality code**: parsing, validation, structure.
- **Streaming** large files with bounded memory.
- Correct **aggregations** (counts, rates, percentiles, top-K).
- Handling **messy data** and knowing when to use existing tools (or distributed processing).

#### Key points
- **Stream line by line**; never read the whole file into memory.
- Parse with a **compiled regex** or `split`, validate fields, and **count malformed lines** instead of crashing.
- Aggregate with dictionaries/`Counter`: per-endpoint counts, errors, latencies.
- **Normalise endpoints** (`/api/orders/123` → `/api/orders/:id`) to avoid high cardinality.
- **Percentiles:** exact requires storing values (or sorting); for large data use **histograms/buckets**, t-digest or HDR histograms.
- **Top-K users:** Counter + heap (`most_common`).
- Scale: split files and **map-reduce** (aggregate per chunk, then merge); percentile sketches must be **mergeable**.
- Know the tools: `awk`/`sort`/`uniq` for quick answers, or log platforms (Elasticsearch, BigQuery) in production.

#### Model answer
"I'd clarify: the exact format and whether it can vary; what counts as an error (5xx only, or 4xx too?); whether endpoints contain IDs; file size vs memory; whether exact percentiles are required. I'll assume errors are 5xx, and IDs need normalising.

**Design:**
1. A **parser** that turns a line into a structured record or returns None if malformed.
2. An **aggregator** that updates statistics incrementally.
3. A **report** function.
4. A streaming **main loop**.

```python
import re
import heapq
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Iterable, Optional

LINE_RE = re.compile(
    r"^(?P<ts>\S+)\s+(?P<method>[A-Z]+)\s+(?P<path>\S+)\s+"
    r"(?P<status>\d{3})\s+(?P<latency>\d+)ms\s+user=(?P<user>\S+)$"
)
ID_RE = re.compile(r"/\d+(?=/|$)")

@dataclass
class Record:
    endpoint: str
    status: int
    latency_ms: int
    user: str

def parse(line: str) -> Optional[Record]:
    m = LINE_RE.match(line.strip())
    if not m:
        return None
    path = m["path"].split("?", 1)[0]                   # drop query string
    endpoint = f"{m['method']} {ID_RE.sub('/:id', path)}"
    return Record(endpoint, int(m["status"]), int(m["latency"]), m["user"])

@dataclass
class Stats:
    requests: Counter = field(default_factory=Counter)
    errors: Counter = field(default_factory=Counter)
    latencies: dict = field(default_factory=lambda: defaultdict(list))
    users: Counter = field(default_factory=Counter)
    malformed: int = 0

    def add(self, r: Record) -> None:
        self.requests[r.endpoint] += 1
        if r.status >= 500:
            self.errors[r.endpoint] += 1
        self.latencies[r.endpoint].append(r.latency_ms)
        self.users[r.user] += 1

def percentile(values: list[int], p: float) -> int:
    s = sorted(values)
    k = max(0, int(round(p / 100 * len(s))) - 1)       # nearest-rank method
    return s[k]

def aggregate(lines: Iterable[str]) -> Stats:
    stats = Stats()
    for line in lines:
        rec = parse(line)
        if rec is None:
            stats.malformed += 1
            continue
        stats.add(rec)
    return stats

def report(stats: Stats) -> None:
    for ep, n in stats.requests.most_common():
        err_rate = stats.errors[ep] / n
        p95 = percentile(stats.latencies[ep], 95)
        print(f"{ep:<35} {n:>8} req  {err_rate:6.2%} 5xx  p95={p95}ms")
    print("Top users:", stats.users.most_common(10))
    print("Malformed lines:", stats.malformed)

if __name__ == "__main__":
    import sys
    with open(sys.argv[1], encoding="utf-8", errors="replace") as f:
        report(aggregate(f))                            # streams line by line
```

**Design choices:**
- **Streaming:** iterating the file object reads one line at a time, so memory doesn't depend on file size, except for what we keep in aggregates.
- **Malformed lines** are counted and skipped (and in production a sample logged), because one bad line shouldn't kill a nightly report. `errors="replace"` handles invalid bytes.
- **Endpoint normalisation** prevents `/api/orders/1`, `/api/orders/2`… becoming millions of separate keys.
- **Separation** of parse/aggregate/report makes each part unit-testable.

**Memory: the percentile problem.** Storing every latency is O(n) memory: 100M requests is roughly 3–4 GB in Python lists. Options:
- **Fixed histogram buckets** (e.g. 0–5 ms, 5–10 ms, …, log-scaled): O(buckets) memory per endpoint; percentiles approximated within bucket width. This is exactly how Prometheus histograms work.
- **t-digest / HDR histogram:** accurate approximate percentiles with small memory, and **mergeable** across chunks.
- **Reservoir sampling:** keep a uniform random sample of, say, 10,000 latencies per endpoint.
```python
import bisect
BOUNDS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, float("inf")]

def bucket_index(ms):                 # histogram instead of storing every value
    return bisect.bisect_left(BOUNDS, ms)

def hist_percentile(counts, p):
    target, running = p / 100 * sum(counts), 0
    for i, c in enumerate(counts):
        running += c
        if running >= target:
            return BOUNDS[i]          # upper bound of the bucket
```
The top-users Counter can also grow large with millions of users; if so, use a Count-Min Sketch plus heap, or process in a database.

**Scaling beyond one machine:**
- Split the input (by file or byte ranges aligned to line boundaries) and run `aggregate` on each chunk in parallel (multiprocessing, or a cluster).
- **Merge** results: counts add up; histograms add bucket-wise; t-digests merge; user counters add (then select top 10 after merging, not before).
- At larger scale, this is a classic **MapReduce / Spark** job, or better: ship logs to a platform (BigQuery, ClickHouse, Elasticsearch) and query with SQL.

**Quick shell version** for ad-hoc questions:
```bash
awk '{print $2, $3}' access.log | sed -E 's#/[0-9]+#/:id#g' | sort | uniq -c | sort -rn | head
```

**Testing:** unit tests for `parse` (valid lines, missing fields, extra spaces, query strings, IDs), for percentile edge cases (one value, all equal), and an end-to-end test on a small fixture file."

#### Another worked example: an incident investigation
"During an incident, we needed the slowest endpoints in the last hour from 6 GB of logs on a bastion host without our log platform. A streaming Python script with per-endpoint histograms finished in 3 minutes using 50 MB of memory, and showed `POST /api/checkout` p95 jumping from 300 ms to 4 s, which pointed us at a payment provider timeout."

#### A third worked example: high-cardinality explosion
"A first version keyed stats by raw path. One endpoint included order IDs, creating 4 million keys and exhausting memory. Normalising numeric and UUID segments (`/:id`) reduced keys to 120 endpoints. The same lesson applies to metrics labels in Prometheus: never use unbounded values like user IDs as labels."

#### Variations you might be asked
- "Requests per minute time series": bucket by `ts[:16]` (minute) and count.
- "Find users with more than 100 requests in any 1-minute window": per-user deque of timestamps (sliding window).
- "Logs are JSON lines": `json.loads` per line with try/except; same aggregation.
- "Logs arrive continuously": tail the file or consume from a stream (Kafka), maintaining rolling aggregates per time window.

#### Step-by-step framework
1. **Clarify** format, definitions (errors), size, exactness.
2. **Parse robustly** with validation and malformed counting.
3. **Normalise** high-cardinality fields.
4. **Aggregate incrementally** in streaming fashion.
5. **Choose percentile strategy** for memory.
6. **Discuss scaling** (parallel chunks, mergeable aggregates, platforms) and testing.

#### Strong versus weak answer
| Weak answer | Strong answer |
|---|---|
| `f.read().split('\n')` | Streams line by line |
| Crashes on bad lines | Counts and skips malformed lines |
| Raw paths as keys | Normalises IDs |
| Stores all latencies regardless of size | Histograms/t-digest when large |
| Merges per-chunk top-10s | Merges counts, then selects |
| No tests | Unit tests for parsing and percentiles |

#### Useful phrases
- "I'll stream the file so memory doesn't depend on its size."
- "One malformed line shouldn't fail the whole report; I'll count and sample them."
- "Exact percentiles need all values; at this scale I'd use a mergeable histogram."
- "Aggregations need to be mergeable so we can parallelise."

#### Common pitfalls
- **Loading the whole file.**
- **Averaging percentiles** across chunks (mathematically wrong).
- **High cardinality** keys.
- **Fragile parsing** (splitting on spaces when fields may contain spaces).

#### Follow-ups to expect (with sample answers)
- **"Why can't you average p95s from different chunks?"**
  "Percentiles aren't linear; you must merge the underlying distributions (histograms/sketches) and compute p95 from the merged result."
- **"How would you make it faster in Python?"**
  "Use multiprocessing across chunks, avoid regex where `split` suffices, or use PyPy/Polars; or do it in a columnar database."
- **"How do you handle timezones and log rotation?"**
  "Parse timestamps as UTC, and process rotated files (including gzipped) by opening them with the right reader in order."

#### What senior interviewers look for
- **Production-quality** structure and robustness.
- **Memory and scale awareness.**
- **Pragmatism**: knowing when to use shell tools or a log platform.

#### Practise it
1. Write the parser and aggregator with unit tests for five tricky lines.
2. Replace exact percentiles with histogram buckets and compare results.
3. Explain how you'd parallelise and merge results, out loud.
