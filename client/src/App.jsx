import { useEffect, useState } from "react";
import { SketchyDefs, ProfileIcon } from "./components/icons.jsx";
import Onboarding from "./components/Onboarding.jsx";
import GroupSetup from "./components/GroupSetup.jsx";
import WriteScreen from "./components/WriteScreen.jsx";
import FriendsScreen from "./components/FriendsScreen.jsx";
import FeedScreen from "./components/FeedScreen.jsx";
import ArchiveScreen from "./components/ArchiveScreen.jsx";
import BottomTabBar from "./components/BottomTabBar.jsx";
import ProfileOverlay from "./components/ProfileOverlay.jsx";
import PhotoModal from "./components/PhotoModal.jsx";
import * as api from "./api.js";
import { loadSession, saveSession, clearSession } from "./state/session.js";
import { getTodayISO, getCurrentYearMonth, toMonthKey, formatKoreanDateLabel } from "./lib/date.js";

const ITEM_LABELS = { doneWell: "칭찬, 한가지", endured: "칭찬, 두가지", wordToMe: "칭찬, 세가지" };

function emptyDiary() {
  return {
    doneWell: { text: "", fromPhoto: false },
    endured: { text: "", fromPhoto: false },
    wordToMe: { text: "", fromPhoto: false },
  };
}

function isDiaryComplete(diary) {
  return !!(diary.doneWell.text && diary.endured.text && diary.wordToMe.text);
}

function entryToDiary(entry) {
  return entry
    ? { doneWell: { ...entry.doneWell }, endured: { ...entry.endured }, wordToMe: { ...entry.wordToMe } }
    : emptyDiary();
}

function entryToItems(entry) {
  if (!entry) return null;
  return [
    { label: ITEM_LABELS.doneWell, fromPhoto: entry.doneWell.fromPhoto, text: entry.doneWell.text },
    { label: ITEM_LABELS.endured, fromPhoto: entry.endured.fromPhoto, text: entry.endured.text },
    { label: ITEM_LABELS.wordToMe, fromPhoto: entry.wordToMe.fromPhoto, text: entry.wordToMe.text },
  ];
}

function closedPhotoModal() {
  return { open: false, stage: "source", error: null, target: null };
}

function initialState() {
  const { year, month } = getCurrentYearMonth();
  return {
    view: "boot", // boot | onboarding | groupSetup | app
    session: null,

    groupMode: null, // create | join | solo
    groupCreated: false,
    createdGroupCode: null,
    groupNameValue: "",
    memberNameValue: "",
    joinCodeValue: "",
    groupSetupSubmitting: false,
    groupSetupError: null,

    activeTab: "write",
    diary: emptyDiary(),
    todayCompleted: false,
    showCelebration: false,
    streak: 0,
    saveSubmitting: false,

    members: [],
    feedPosts: [],
    expandedFeed: {},

    archiveYear: year,
    archiveMonth: month,
    monthStatus: {},
    selectedDate: getTodayISO(),
    selectedEntryItems: null,
    archiveLoading: false,

    photoModal: closedPhotoModal(),
    showProfile: false,
    notifyOn: true,
  };
}

export default function App() {
  const [state, setState] = useState(initialState);

  function patch(update) {
    setState((s) => ({ ...s, ...(typeof update === "function" ? update(s) : update) }));
  }

  // --- boot: resume session or show onboarding ---
  useEffect(() => {
    const session = loadSession();
    if (!session) {
      patch({ view: "onboarding" });
      return;
    }
    patch({ session, view: "app" });
    (async () => {
      try {
        const today = getTodayISO();
        const [entry, members] = await Promise.all([
          api.fetchEntry(session.groupCode, session.memberId, today),
          api.fetchMembers(session.groupCode),
        ]);
        const mine = members.find((m) => m.id === session.memberId);
        patch({
          diary: entryToDiary(entry),
          todayCompleted: !!entry && isDiaryComplete(entryToDiary(entry)),
          streak: mine?.streak ?? 0,
          members,
        });
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // --- refetch whatever the active tab needs ---
  useEffect(() => {
    if (state.view !== "app" || !state.session) return;
    const { groupCode, memberId } = state.session;

    if (state.activeTab === "write" || state.activeTab === "friends") {
      api
        .fetchMembers(groupCode)
        .then((members) => patch({ members }))
        .catch((err) => console.error(err));
    } else if (state.activeTab === "feed") {
      api
        .fetchFeed(groupCode, memberId)
        .then((feedPosts) => patch({ feedPosts }))
        .catch((err) => console.error(err));
    } else if (state.activeTab === "archive") {
      const monthKey = toMonthKey(state.archiveYear, state.archiveMonth);
      api
        .fetchMonthStatus(groupCode, memberId, monthKey)
        .then((monthStatus) => patch({ monthStatus }))
        .catch((err) => console.error(err));
      if (state.selectedDate === getTodayISO()) {
        patch((s) => ({ selectedEntryItems: s.todayCompleted ? entryToItems(s.diary) : null }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeTab, state.view, state.session]);

  // --- navigation ---
  const goGroupCreate = () =>
    patch({ view: "groupSetup", groupMode: "create", groupCreated: false, groupSetupError: null });
  const goGroupJoin = () => patch({ view: "groupSetup", groupMode: "join", groupSetupError: null });
  const goSolo = () => patch({ view: "groupSetup", groupMode: "solo", groupSetupError: null });
  const backToOnboarding = () => patch({ view: "onboarding", groupSetupError: null });

  // --- group setup ---
  const onGroupNameInput = (e) => patch({ groupNameValue: e.target.value });
  const onMemberNameInput = (e) => patch({ memberNameValue: e.target.value });
  const onJoinCodeInput = (e) => patch({ joinCodeValue: e.target.value });

  async function afterLogin(result) {
    const session = {
      groupCode: result.groupCode,
      groupId: result.groupId,
      groupName: result.groupName,
      memberId: result.memberId,
      memberName: result.memberName,
    };
    saveSession(session);
    patch({ session });
    try {
      const [entry, members] = await Promise.all([
        api.fetchEntry(session.groupCode, session.memberId, getTodayISO()),
        api.fetchMembers(session.groupCode),
      ]);
      const mine = members.find((m) => m.id === session.memberId);
      patch({
        diary: entryToDiary(entry),
        todayCompleted: !!entry && isDiaryComplete(entryToDiary(entry)),
        streak: mine?.streak ?? 0,
        members,
      });
    } catch (err) {
      console.error(err);
    }
  }

  const submitGroupCreate = async () => {
    const groupName = state.groupNameValue.trim();
    const memberName = state.memberNameValue.trim();
    if (!memberName) return patch({ groupSetupError: "이름을 입력해주세요." });
    patch({ groupSetupSubmitting: true, groupSetupError: null });
    try {
      const result = await api.createGroup(groupName, memberName);
      patch({ groupCreated: true, createdGroupCode: result.groupCode, groupSetupSubmitting: false });
      await afterLogin(result);
    } catch (err) {
      patch({ groupSetupSubmitting: false, groupSetupError: err.message });
    }
  };

  const submitJoinCode = async () => {
    const memberName = state.memberNameValue.trim();
    if (!memberName) return patch({ groupSetupError: "이름을 입력해주세요." });
    if (!state.joinCodeValue.trim()) return patch({ groupSetupError: "초대 코드를 입력해주세요." });
    patch({ groupSetupSubmitting: true, groupSetupError: null });
    try {
      const result = await api.joinGroup(state.joinCodeValue.trim(), memberName);
      await afterLogin(result);
      patch({ view: "app", groupSetupSubmitting: false });
    } catch (err) {
      patch({ groupSetupSubmitting: false, groupSetupError: err.message });
    }
  };

  const submitSolo = async () => {
    const memberName = state.memberNameValue.trim();
    if (!memberName) return patch({ groupSetupError: "이름을 입력해주세요." });
    patch({ groupSetupSubmitting: true, groupSetupError: null });
    try {
      const result = await api.createGroup(`${memberName}의 칭찬 일기`, memberName);
      await afterLogin(result);
      patch({ view: "app", groupSetupSubmitting: false });
    } catch (err) {
      patch({ groupSetupSubmitting: false, groupSetupError: err.message });
    }
  };

  const enterApp = () => patch({ view: "app" });

  // --- profile ---
  const openProfile = () => patch({ showProfile: true });
  const closeProfile = () => patch({ showProfile: false });
  const toggleNotify = () => patch((s) => ({ notifyOn: !s.notifyOn }));
  const logout = () => {
    clearSession();
    setState(initialState());
    patch({ view: "onboarding" });
  };

  // --- tabs ---
  const setTab = (tab) => patch({ activeTab: tab, showCelebration: false });

  // --- diary write ---
  const onFieldInput = (field, e) => {
    const val = e.target.value;
    patch((s) => ({ diary: { ...s.diary, [field]: { ...s.diary[field], text: val } } }));
  };

  const saveDiary = async () => {
    const d = state.diary;
    if (!d.doneWell.text || !d.endured.text || !d.wordToMe.text) return;
    patch({ saveSubmitting: true });
    const { groupCode, memberId } = state.session;
    try {
      const result = await api.saveEntry(groupCode, memberId, getTodayISO(), {
        doneWell: d.doneWell,
        endured: d.endured,
        wordToMe: d.wordToMe,
      });
      patch({
        todayCompleted: result.completed,
        showCelebration: result.completed,
        streak: result.streak,
        saveSubmitting: false,
      });
      api
        .fetchMembers(groupCode)
        .then((members) => patch({ members }))
        .catch((err) => console.error(err));
    } catch (err) {
      patch({ saveSubmitting: false });
      window.alert(err.message || "저장에 실패했어요. 다시 시도해주세요.");
    }
  };
  const closeCelebration = () => patch({ showCelebration: false });

  // --- photo modal ---
  const openCameraForField = (field) =>
    patch({ photoModal: { open: true, stage: "source", error: null, target: { type: "diary", field } } });
  const openCameraForArchiveDay = (date) =>
    patch({ photoModal: { open: true, stage: "source", error: null, target: { type: "archive", date } } });
  const closePhotoModal = () => patch({ photoModal: closedPhotoModal() });
  const onStartRecognizing = () => patch((s) => ({ photoModal: { ...s.photoModal, stage: "capturing", error: null } }));
  const onPhotoError = (message) => patch((s) => ({ photoModal: { ...s.photoModal, stage: "source", error: message } }));

  const onPhotoResolved = (text) => {
    const target = state.photoModal.target;
    if (!target) return;

    if (target.type === "diary") {
      patch((s) => ({
        diary: { ...s.diary, [target.field]: { text, fromPhoto: true } },
        photoModal: closedPhotoModal(),
      }));
      return;
    }

    // archive: filling in a past day that currently has no entry at all
    patch({ photoModal: closedPhotoModal() });
    if (target.date === getTodayISO()) {
      patch((s) => ({ diary: { ...s.diary, doneWell: { text, fromPhoto: true } } }));
      return;
    }
    const { groupCode, memberId } = state.session;
    const payload = {
      doneWell: { text, fromPhoto: true },
      endured: { text: "", fromPhoto: false },
      wordToMe: { text: "", fromPhoto: false },
    };
    api
      .saveEntry(groupCode, memberId, target.date, payload)
      .then(() =>
        api.fetchMonthStatus(groupCode, memberId, toMonthKey(state.archiveYear, state.archiveMonth))
      )
      .then((monthStatus) => {
        patch({
          monthStatus,
          selectedDate: target.date,
          selectedEntryItems: entryToItems(payload),
        });
      })
      .catch((err) => window.alert(err.message || "저장에 실패했어요."));
  };

  // --- feed ---
  const toggleExpand = (key) => patch((s) => ({ expandedFeed: { ...s.expandedFeed, [key]: !s.expandedFeed[key] } }));
  const toggleReact = async (entryId) => {
    const { groupCode, memberId } = state.session;
    try {
      const { reactionCount, reacted } = await api.toggleReaction(groupCode, entryId, memberId);
      patch((s) => ({
        feedPosts: s.feedPosts.map((p) => (p.entryId === entryId ? { ...p, reactionCount, viewerReacted: reacted } : p)),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // --- archive ---
  const selectDay = (dateKey) => {
    if (dateKey === getTodayISO()) {
      patch({ selectedDate: dateKey, selectedEntryItems: state.todayCompleted ? entryToItems(state.diary) : null });
      return;
    }
    patch({ selectedDate: dateKey, selectedEntryItems: null, archiveLoading: true });
    const { groupCode, memberId } = state.session;
    api
      .fetchEntry(groupCode, memberId, dateKey)
      .then((entry) => patch({ selectedEntryItems: entryToItems(entry), archiveLoading: false }))
      .catch((err) => {
        console.error(err);
        patch({ archiveLoading: false });
      });
  };
  const addPastPhoto = () => openCameraForArchiveDay(state.selectedDate);

  return (
    <div className="app-shell">
      <SketchyDefs />

      {state.view === "onboarding" && (
        <Onboarding onGroupCreate={goGroupCreate} onGroupJoin={goGroupJoin} onSolo={goSolo} />
      )}

      {state.view === "groupSetup" && (
        <GroupSetup
          groupMode={state.groupMode}
          groupCreated={state.groupCreated}
          createdGroupCode={state.createdGroupCode}
          groupNameValue={state.groupNameValue}
          memberNameValue={state.memberNameValue}
          joinCodeValue={state.joinCodeValue}
          submitting={state.groupSetupSubmitting}
          error={state.groupSetupError}
          onBack={backToOnboarding}
          onGroupNameInput={onGroupNameInput}
          onMemberNameInput={onMemberNameInput}
          onJoinCodeInput={onJoinCodeInput}
          onSubmitGroupCreate={submitGroupCreate}
          onSubmitJoinCode={submitJoinCode}
          onSubmitSolo={submitSolo}
          onEnterApp={enterApp}
        />
      )}

      {state.view === "app" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px 6px", flexShrink: 0 }}>
            <div className="font-gaegu" style={{ fontWeight: 700, fontSize: 20, color: "var(--color-ink-soft)" }}>
              칭찬 일기
            </div>
            <button
              onClick={openProfile}
              style={{ border: "none", background: "oklch(95% 0.02 75)", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <ProfileIcon />
            </button>
          </div>

          <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
            {state.activeTab === "write" && (
              <WriteScreen
                diary={state.diary}
                streak={state.streak}
                todayLabel={formatKoreanDateLabel(new Date())}
                showCelebration={state.showCelebration}
                members={state.members}
                saving={state.saveSubmitting}
                onFieldInput={onFieldInput}
                onOpenCamera={openCameraForField}
                onSaveDiary={saveDiary}
                onCloseCelebration={closeCelebration}
              />
            )}
            {state.activeTab === "friends" && <FriendsScreen members={state.members} />}
            {state.activeTab === "feed" && (
              <FeedScreen
                posts={state.feedPosts}
                expandedFeed={state.expandedFeed}
                onToggleExpand={toggleExpand}
                onToggleReact={toggleReact}
              />
            )}
            {state.activeTab === "archive" && (
              <ArchiveScreen
                year={state.archiveYear}
                month={state.archiveMonth}
                monthStatus={state.monthStatus}
                selectedDate={state.selectedDate}
                selectedEntryItems={state.selectedEntryItems}
                loading={state.archiveLoading}
                onSelectDay={selectDay}
                onAddPastPhoto={addPastPhoto}
              />
            )}
          </div>

          <BottomTabBar activeTab={state.activeTab} onSelect={setTab} />
        </div>
      )}

      {state.view === "app" && state.showProfile && (
        <ProfileOverlay
          streak={state.streak}
          groupName={state.session?.groupName}
          memberName={state.session?.memberName}
          notifyOn={state.notifyOn}
          onClose={closeProfile}
          onToggleNotify={toggleNotify}
          onLogout={logout}
        />
      )}

      <PhotoModal
        modal={state.photoModal}
        onClose={closePhotoModal}
        onStartRecognizing={onStartRecognizing}
        onResolved={onPhotoResolved}
        onError={onPhotoError}
      />
    </div>
  );
}
