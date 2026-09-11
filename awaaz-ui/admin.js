import { auth, db } from "./firebase.js";
import { cloudinaryConfig } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = id => document.getElementById(id);
let editingId = "";
let posts = [];
let currentProfile = null;

function msg(text, good = false) {
  $("loginMsg").textContent = text;
  $("loginMsg").style.color = good ? "#237a45" : "#b4472e";
}

function adminError(error) {
  console.error(error);
  const code = error?.code || "";
  const map = {
    "auth/invalid-credential": "Email या password गलत है.",
    "auth/email-already-in-use": "यह email पहले से registered है.",
    "auth/weak-password": "Password कम से कम 6 characters का रखें.",
    "auth/invalid-email": "Valid email डालें.",
    "permission-denied": "Firestore permission denied. User role/rules check करें."
  };
  return map[code] || error?.message || "कुछ गलत हो गया.";
}

function isSignedIn() { return !!auth.currentUser; }
function isStaffRole(role) { return role === "admin" || role === "editor"; }
function isAdminRole(role) { return role === "admin"; }

async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  // New accounts are created with the least-privileged role.
  await setDoc(ref, {
    email: user.email || "",
    displayName: user.email?.split("@")[0] || "Awaaz User",
    role: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  const created = await getDoc(ref);
  return { id: created.id, ...created.data() };
}

async function hydrateProfile(user) {
  try {
    currentProfile = await ensureUserProfile(user);
    $("adminIdentity").textContent = `${user.email || ""} · ${currentProfile.role}`;
    $("roleBadge").textContent = currentProfile.role.toUpperCase();

    if (!isStaffRole(currentProfile.role)) {
      $("dashboard").hidden = true;
      $("login").hidden = false;
      msg("यह account अभी normal user है. Admin/Editor access के लिए profile का role बदलें.");
      await signOut(auth);
      return false;
    }

    // Editors cannot publish or use the all-posts admin controls.
    $("status").disabled = isAdminRole(currentProfile.role) ? false : true;
    if (!isAdminRole(currentProfile.role)) {
      $("status").value = "draft";
      $("statusHint").textContent = "Editor केवल drafts save कर सकता है; publish Admin करेगा.";
      $("statusHint").hidden = false;
    } else {
      $("statusHint").hidden = true;
    }

    return true;
  } catch (e) {
    alert(adminError(e));
    await signOut(auth);
    return false;
  }
}

$("loginBtn").onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, $("adminEmail").value.trim(), $("adminPass").value);
  } catch (e) { msg(adminError(e)); }
};

$("signupBtn").onclick = async () => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, $("adminEmail").value.trim(), $("adminPass").value);
    msg("Account बन गया. यह account default में normal user है. Admin इसे बाद में admin/editor role देगा.", true);
    // onAuthStateChanged will create the user profile.
    void credential;
  } catch (e) { msg(adminError(e)); }
};

$("logout").onclick = () => signOut(auth);
$("refreshBtn").onclick = loadPosts;
$("cancelEdit").onclick = resetForm;

onAuthStateChanged(auth, async user => {
  if (!user) {
    currentProfile = null;
    $("login").hidden = false;
    $("dashboard").hidden = true;
    return;
  }

  const allowed = await hydrateProfile(user);
  if (!allowed) return;

  $("login").hidden = true;
  $("dashboard").hidden = false;
  await loadPosts();
});

async function loadPosts() {
  if (!isSignedIn() || !isStaffRole(currentProfile?.role)) return;
  try {
    const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
    posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdmin();
  } catch (e) { alert(adminError(e)); }
}

function formatDate(v) {
  return v?.toDate ? v.toDate().toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"}) : (v || "");
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[m]));
}

$("imageFile").onchange = async () => {
  const file = $("imageFile").files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return alert("Sirf image file upload करें.");
  if (file.size > 5 * 1024 * 1024) return alert("Image 5MB से छोटी रखें.");
  $("uploadStatus").textContent = "Cloudinary पर image upload हो रही है…";
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", cloudinaryConfig.uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, { method:"POST", body:form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");
    $("image").value = data.secure_url;
    $("uploadStatus").textContent = "Image upload हो गई ✓";
  } catch (e) {
    console.error(e);
    $("uploadStatus").textContent = "Image upload failed";
    alert(e.message);
  }
};

$("postForm").onsubmit = async e => {
  e.preventDefault();
  if (!isSignedIn() || !isStaffRole(currentProfile?.role)) return alert("Admin/Editor access जरूरी है.");

  const isAdmin = isAdminRole(currentProfile.role);
  const selectedStatus = isAdmin ? $("status").value : "draft";
  const uid = auth.currentUser.uid;
  const item = {
    title: $("title").value.trim(),
    subtitle: $("subtitle").value.trim(),
    category: $("category").value,
    image: $("image").value.trim(),
    content: $("content").value.trim(),
    author: $("author").value.trim() || "Awaaz Editorial",
    authorId: uid,
    status: selectedStatus,
    language: /[\u0900-\u097F]/.test($("content").value) ? "hi" : "en",
    updatedAt: serverTimestamp()
  };

  try {
    if (editingId) {
      const existing = posts.find(p => p.id === editingId);
      if (!isAdmin && existing?.authorId !== uid) {
        return alert("Editor केवल अपनी posts edit कर सकता है.");
      }
      await updateDoc(doc(db, "posts", editingId), item);
    } else {
      await addDoc(collection(db, "posts"), { ...item, createdAt: serverTimestamp() });
    }
    alert(isAdmin ? "Post saved ✓" : "Draft saved ✓");
    resetForm();
    await loadPosts();
  } catch (e) { alert(adminError(e)); }
};

function resetForm() {
  editingId = "";
  $("postForm").reset();
  $("editId").value = "";
  $("formTitle").textContent = "New Post";
  $("cancelEdit").hidden = true;
  $("author").value = "Awaaz Editorial";
  $("uploadStatus").textContent = "";
  if (currentProfile?.role === "editor") $("status").value = "draft";
}

window.editPost = id => {
  const x = posts.find(p => p.id === id);
  if (!x) return;
  const isAdmin = isAdminRole(currentProfile?.role);
  if (!isAdmin && x.authorId !== auth.currentUser?.uid) return alert("Editor केवल अपनी posts edit कर सकता है.");

  editingId = id;
  $("editId").value = id;
  $("title").value = x.title || "";
  $("subtitle").value = x.subtitle || "";
  $("category").value = x.category || "कहानी";
  $("image").value = x.image || "";
  $("content").value = x.content || "";
  $("author").value = x.author || "Awaaz Editorial";
  $("status").value = isAdmin ? (x.status || "draft") : "draft";
  $("formTitle").textContent = "Edit Post";
  $("cancelEdit").hidden = false;
  scrollTo({top:300, behavior:"smooth"});
};

window.deletePost = async id => {
  const x = posts.find(p => p.id === id);
  const isAdmin = isAdminRole(currentProfile?.role);
  if (!x) return;
  if (!isAdmin && (x.authorId !== auth.currentUser?.uid || x.status !== "draft")) {
    return alert("Editor केवल अपनी draft post delete कर सकता है.");
  }
  if (!confirm("Delete this post permanently?")) return;
  try {
    await deleteDoc(doc(db, "posts", id));
    await loadPosts();
  } catch(e) { alert(adminError(e)); }
};

function renderAdmin() {
  $("totalStat").textContent = posts.length;
  $("liveStat").textContent = posts.filter(x => x.status === "published").length;
  $("draftStat").textContent = posts.filter(x => x.status === "draft").length;
  $("adminPosts").innerHTML = posts.map(x => `
    <div class="admin-post">
      <img class="admin-thumb" src="${escapeHtml(x.image || "")}" alt="">
      <div>
        <h3>${escapeHtml(x.title)}</h3>
        <p>${escapeHtml(x.category)} · ${escapeHtml(x.status)} · ${escapeHtml(formatDate(x.createdAt))}</p>
        <small>${escapeHtml(x.author || "")} · ${escapeHtml(x.authorId || "")}</small>
      </div>
      <div class="actions">
        <button onclick="editPost('${escapeHtml(x.id)}')">Edit</button>
        <button class="delete" onclick="deletePost('${escapeHtml(x.id)}')">Delete</button>
      </div>
    </div>`).join("") || "<p>No posts yet.</p>";
}
