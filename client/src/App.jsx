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
import RecoveryCodeScreen from "./components/RecoveryCodeScreen.jsx";
import RecoverScreen from "./components/RecoverScreen.jsx";
import PhotoModal from "./components/PhotoModal.jsx";
import * as api from "./api.js";
import { getOrCreateDeviceKey, loadPersonSession, savePersonSession, setDeviceKey } from "./state/session.js";
import { getTodayISO, getCurrentYearMonth, toMonthKey, formatKoreanDateLabel } from "./lib/date.js";

const ITEM_LABELS = { doneWell: "하나", endured: "둘", wordToMe: "셋" };

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

function hasDiaryContent(diary) {
  return !!(diary.doneWell.text || diary.endured.text || diary.wordToMe.text);
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
    view: "boot", // boot | onboarding | groupSetup | app | recover | recoveryCode
    deviceKey: null,
    personId: null,
    displayName: null,
    activeGroupCode: null,
    activeGroupId: null,
    activeGroupName: null,
    myGroups: [],

    groupMode: null, // create | join | solo
    groupSetupNameKnown: false, // true = invoked from inside the app (name already known)
    groupCreated: false,
    createdGroupCode: null,
    groupNameValue: "",
    memberNameValue: "",
    joinCodeValue: "",
    groupSetupSubmitting: false,
    groupSetupError: null,

    activeTab: "write",
    diary: emptyDiary(),
    persistedDiaryHasContent: false,
    todayCompleted: false,
    showCelebration: false,
    partialSaveNotice: false,
    streak: 0,
    saveSubmitting: false,

    members: [],
    feedPosts: [],
    expandedFeed: {},

    archiveYear: year,
    archiveMonth: month,
    monthStatus: {},
    selectedDate: getTodayISO(),
    selectedDiary: emptyDiary(),
    selectedEntryItems: null,
    archiveLoading: false,
    archiveEditMode: false,
    archiveEditDiary: emptyDiary(),
    archiveEditHadContent: false,
    archiveEditSaving: false,

    photoModal: closedPhotoModal(),
    showProfile: false,
    notifyOn: true,

    recoveryCodeValue: null,
    recoveryCodeLoading: false,
    recoveryCodeError: null,
    recoveryCodeCopied: false,
    recoverInputValue: "",
    recoverSubmitting: false,
    recoverError: null,
  };
}

export default function App() {
  const [state, setState] = useState(initialState);

  function patch(update) {
    setState((s) => ({ ...s, ...(typeof update === "function" ? update(s) : update) }));
  }

  async function bootstrapPersonalData(personId) {
    try {
      const [entry, streakRes] = await Promise.all([
        api.fetchEntry(personId, getTodayISO()),
        api.fetchStreak(personId),
      ]);
      const diary = entryToDiary(entry);
      patch({
        diary,
        persistedDiaryHasContent: hasDiaryContent(diary),
        todayCompleted: !!entry && isDiaryComplete(diary),
        streak: streakRes.streak,
      });
    } catch (err) {
      console.error(err);
    }
  }

  function refreshMyGroups(personId) {
    api
      .fetchMyGroups(personId)
      .then((myGroups) => patch({ myGroups }))
      .catch((err) => console.error(err));
  }

  // --- boot: resume person (device-level identity) or show onboarding ---
  useEffect(() => {
    const deviceKey = getOrCreateDeviceKey();
    const saved = loadPersonSession();
    if (!saved) {
      patch({ deviceKey, view: "onboarding" });
      return;
    }
    patch({
      deviceKey,
      personId: saved.personId,
      displayName: saved.displayName,
      activeGroupCode: saved.activeGroupCode ?? null,
      activeGroupId: saved.activeGroupId ?? null,
      activeGroupName: saved.activeGroupName ?? null,
      view: "app",
    });
    bootstrapPersonalData(saved.personId);
    refreshMyGroups(saved.personId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- refetch whatever the active tab needs ---
  useEffect(() => {
    if (state.view !== "app" || !state.personId) return;
    const { personId, activeGroupCode } = state;

    if (state.activeTab === "write" || state.activeTab === "friends") {
      if (activeGroupCode) {
        api
          .fetchMembers(activeGroupCode)
          .then((members) => patch({ members }))
          .catch((err) => console.error(err));
      } else {
        patch({ members: [] });
      }
    } else if (state.activeTab === "feed") {
      if (activeGroupCode) {
        api
          .fetchFeed(activeGroupCode, personId)
          .then((feedPosts) => patch({ feedPosts }))
          .catch((err) => console.error(err));
      } else {
        patch({ feedPosts: [] });
      }
    } else if (state.activeTab === "archive") {
      const monthKey = toMonthKey(state.archiveYear, state.archiveMonth);
      api
        .fetchMonthStatus(personId, monthKey)
        .then((monthStatus) => patch({ monthStatus }))
        .catch((err) => console.error(err));
      if (state.selectedDate === getTodayISO() && !state.archiveEditMode) {
        patch((s) => ({
          selectedDiary: s.diary,
          selectedEntryItems: hasDiaryContent(s.diary) ? entryToItems(s.diary) : null,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeTab, state.view, state.personId, state.activeGroupCode]);

  // --- navigation ---
  const goGroupCreate = (nameKnown = false) =>
    patch({
      view: "groupSetup",
      groupMode: "create",
      groupCreated: false,
      groupSetupError: null,
      groupSetupNameKnown: nameKnown,
      groupNameValue: "",
      memberNameValue: "",
      showProfile: false,
    });
  const goGroupJoin = (nameKnown = false) =>
    patch({
      view: "groupSetup",
      groupMode: "join",
      groupSetupError: null,
      groupSetupNameKnown: nameKnown,
      joinCodeValue: "",
      memberNameValue: "",
      showProfile: false,
    });
  const goSolo = () =>
    patch({ view: "groupSetup", groupMode: "solo", groupSetupError: null, groupSetupNameKnown: false, memberNameValue: "" });
  const backFromGroupSetup = () =>
    patch((s) => (s.groupSetupNameKnown ? { view: "app", groupSetupError: null } : { view: "onboarding", groupSetupError: null }));

  // --- group setup ---
  const onGroupNameInput = (e) => patch({ groupNameValue: e.target.value });
  const onMemberNameInput = (e) => patch({ memberNameValue: e.target.value });
  const onJoinCodeInput = (e) => patch({ joinCodeValue: e.target.value });

  async function afterAuth(result) {
    const isFirstLogin = !state.personId;
    const session = {
      personId: result.personId,
      displayName: result.displayName,
      activeGroupCode: result.groupCode ?? null,
      activeGroupId: result.groupId ?? null,
      activeGroupName: result.groupName ?? null,
    };
    savePersonSession(session);
    patch({
      personId: session.personId,
      displayName: session.displayName,
      activeGroupCode: session.activeGroupCode,
      activeGroupId: session.activeGroupId,
      activeGroupName: session.activeGroupName,
    });
    refreshMyGroups(session.personId);
    if (isFirstLogin) {
      await bootstrapPersonalData(session.personId);
    }
  }

  function resolveDisplayName() {
    return state.groupSetupNameKnown ? state.displayName : state.memberNameValue.trim();
  }

  const submitGroupCreate = async () => {
    const groupName = state.groupNameValue.trim();
    const displayName = resolveDisplayName();
    if (!displayName) return patch({ groupSetupError: "이름을 입력해주세요." });
    patch({ groupSetupSubmitting: true, groupSetupError: null });
    try {
      const result = await api.createGroup(state.deviceKey, displayName, groupName);
      patch({ groupCreated: true, createdGroupCode: result.groupCode, groupSetupSubmitting: false });
      await afterAuth(result);
    } catch (err) {
      patch({ groupSetupSubmitting: false, groupSetupError: err.message });
    }
  };

  const submitJoinCode = async () => {
    const displayName = resolveDisplayName();
    if (!displayName) return patch({ groupSetupError: "이름을 입력해주세요." });
    if (!state.joinCodeValue.trim()) return patch({ groupSetupError: "초대 코드를 입력해주세요." });
    patch({ groupSetupSubmitting: true, groupSetupError: null });
    try {
      const result = await api.joinGroup(state.joinCodeValue.trim(), state.deviceKey, displayName);
      await afterAuth(result);
      patch({ view: "app", groupSetupSubmitting: false });
    } catch (err) {
      patch({ groupSetupSubmitting: false, groupSetupError: err.message });
    }
  };

  const submitSolo = async () => {
    const displayName = state.memberNameValue.trim();
    if (!displayName) return patch({ groupSetupError: "이름을 입력해주세요." });
    patch({ groupSetupSubmitting: true, groupSetupError: null });
    try {
      const result = await api.createPerson(state.deviceKey, displayName);
      await afterAuth(result);
      patch({ view: "app", groupSetupSubmitting: false });
    } catch (err) {
      patch({ groupSetupSubmitting: false, groupSetupError: err.message });
    }
  };

  const enterApp = () => patch({ view: "app" });

  // --- account recovery ---
  const goRecoveryCode = () => {
    patch({ view: "recoveryCode", showProfile: false, recoveryCodeValue: null, recoveryCodeError: null, recoveryCodeCopied: false, recoveryCodeLoading: true });
    api
      .fetchRecoveryCode(state.personId)
      .then((res) => patch({ recoveryCodeValue: res.recoveryCode, recoveryCodeLoading: false }))
      .catch((err) => patch({ recoveryCodeError: err.message, recoveryCodeLoading: false }));
  };
  const backFromRecoveryCode = () => patch({ view: "app", showProfile: true });
  const copyRecoveryCode = () => {
    if (!state.recoveryCodeValue) return;
    navigator.clipboard
      ?.writeText(state.recoveryCodeValue)
      .then(() => {
        patch({ recoveryCodeCopied: true });
        setTimeout(() => patch({ recoveryCodeCopied: false }), 2000);
      })
      .catch(() => {});
  };

  const goRecover = () => patch({ view: "recover", recoverInputValue: "", recoverError: null });
  const backFromRecover = () => patch({ view: "onboarding", recoverError: null });
  const onRecoverInput = (e) => patch({ recoverInputValue: e.target.value, recoverError: null });
  const submitRecover = async () => {
    const code = state.recoverInputValue.trim();
    if (!code) return patch({ recoverError: "복구 코드를 입력해주세요." });
    patch({ recoverSubmitting: true, recoverError: null });
    try {
      const result = await api.recoverByCode(code);
      setDeviceKey(result.deviceKey);
      const myGroups = await api.fetchMyGroups(result.personId).catch(() => []);
      const first = myGroups[0] || null;
      const session = {
        personId: result.personId,
        displayName: result.displayName,
        activeGroupCode: first?.groupCode ?? null,
        activeGroupId: first?.groupId ?? null,
        activeGroupName: first?.groupName ?? null,
      };
      savePersonSession(session);
      patch({
        deviceKey: result.deviceKey,
        personId: session.personId,
        displayName: session.displayName,
        activeGroupCode: session.activeGroupCode,
        activeGroupId: session.activeGroupId,
        activeGroupName: session.activeGroupName,
        myGroups,
        view: "app",
        recoverSubmitting: false,
      });
      await bootstrapPersonalData(session.personId);
    } catch (err) {
      patch({ recoverSubmitting: false, recoverError: err.message });
    }
  };

  // --- profile / groups ---
  const openProfile = () => patch({ showProfile: true });
  const closeProfile = () => patch({ showProfile: false });
  const toggleNotify = () => patch((s) => ({ notifyOn: !s.notifyOn }));

  const switchActiveGroup = (group) => {
    const session = {
      personId: state.personId,
      displayName: state.displayName,
      activeGroupCode: group.groupCode,
      activeGroupId: group.groupId,
      activeGroupName: group.groupName,
    };
    savePersonSession(session);
    patch({
      activeGroupCode: session.activeGroupCode,
      activeGroupId: session.activeGroupId,
      activeGroupName: session.activeGroupName,
      showProfile: false,
      activeTab: "write",
    });
  };

  const leaveActiveGroup = async () => {
    if (!state.activeGroupCode) return;
    try {
      await api.leaveGroup(state.activeGroupCode, state.personId);
      const remaining = state.myGroups.filter((g) => g.groupCode !== state.activeGroupCode);
      const next = remaining[0] || null;
      const session = {
        personId: state.personId,
        displayName: state.displayName,
        activeGroupCode: next?.groupCode ?? null,
        activeGroupId: next?.groupId ?? null,
        activeGroupName: next?.groupName ?? null,
      };
      savePersonSession(session);
      patch({
        myGroups: remaining,
        activeGroupCode: session.activeGroupCode,
        activeGroupId: session.activeGroupId,
        activeGroupName: session.activeGroupName,
        showProfile: false,
      });
    } catch (err) {
      window.alert(err.message || "그룹을 나가지 못했어요.");
    }
  };

  // --- tabs ---
  const setTab = (tab) => patch({ activeTab: tab, showCelebration: false });

  // --- diary write ---
  const onFieldInput = (field, e) => {
    const val = e.target.value;
    patch((s) => ({
      diary: { ...s.diary, [field]: { ...s.diary[field], text: val } },
      partialSaveNotice: false,
    }));
  };

  const onFieldDelete = (field) =>
    patch((s) => ({
      diary: { ...s.diary, [field]: { text: "", fromPhoto: false } },
      partialSaveNotice: false,
    }));

  // Enabled whenever there's something new to write OR something already
  // saved that a delete could clear — disabled only when there is truly
  // nothing to do (a fresh day, never written, still empty).
  const saveDisabled = (!hasDiaryContent(state.diary) && !state.persistedDiaryHasContent) || state.saveSubmitting;

  const saveDiary = async () => {
    const d = state.diary;
    if (!hasDiaryContent(d) && !state.persistedDiaryHasContent) return;
    patch({ saveSubmitting: true });
    try {
      const result = await api.saveEntry(state.personId, getTodayISO(), {
        doneWell: d.doneWell,
        endured: d.endured,
        wordToMe: d.wordToMe,
      });
      patch({
        todayCompleted: result.completed,
        showCelebration: result.completed,
        partialSaveNotice: hasDiaryContent(d) && !result.completed,
        persistedDiaryHasContent: hasDiaryContent(d),
        streak: result.streak,
        saveSubmitting: false,
      });
      if (state.activeGroupCode) {
        api
          .fetchMembers(state.activeGroupCode)
          .then((members) => patch({ members }))
          .catch((err) => console.error(err));
      }
    } catch (err) {
      patch({ saveSubmitting: false });
      window.alert(err.message || "저장에 실패했어요. 다시 시도해주세요.");
    }
  };
  const closeCelebration = () => patch({ showCelebration: false });

  // --- photo modal ---
  const openCameraForField = (field) =>
    patch({ photoModal: { open: true, stage: "source", error: null, target: { type: "diary", field } } });
  const openCameraForArchiveEditField = (field) =>
    patch({ photoModal: { open: true, stage: "source", error: null, target: { type: "archiveEdit", field } } });
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

    if (target.type === "archiveEdit") {
      patch((s) => ({
        archiveEditDiary: { ...s.archiveEditDiary, [target.field]: { text, fromPhoto: true } },
        photoModal: closedPhotoModal(),
      }));
      return;
    }
  };

  // --- feed ---
  const toggleExpand = (key) => patch((s) => ({ expandedFeed: { ...s.expandedFeed, [key]: !s.expandedFeed[key] } }));
  const toggleReact = async (entryId) => {
    if (!state.activeGroupCode) return;
    try {
      const { reactionCount, reacted } = await api.toggleReaction(state.activeGroupCode, entryId, state.personId);
      patch((s) => ({
        feedPosts: s.feedPosts.map((p) => (p.entryId === entryId ? { ...p, reactionCount, viewerReacted: reacted } : p)),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // --- archive (always personal, group-independent) ---
  const selectDay = (dateKey) => {
    patch({ archiveEditMode: false });
    if (dateKey === getTodayISO()) {
      patch({
        selectedDate: dateKey,
        selectedDiary: state.diary,
        selectedEntryItems: hasDiaryContent(state.diary) ? entryToItems(state.diary) : null,
      });
      return;
    }
    patch({ selectedDate: dateKey, selectedDiary: emptyDiary(), selectedEntryItems: null, archiveLoading: true });
    api
      .fetchEntry(state.personId, dateKey)
      .then((entry) => patch({ selectedDiary: entryToDiary(entry), selectedEntryItems: entryToItems(entry), archiveLoading: false }))
      .catch((err) => {
        console.error(err);
        patch({ archiveLoading: false });
      });
  };

  const enterArchiveEdit = () =>
    patch((s) => ({
      archiveEditMode: true,
      archiveEditDiary: { ...s.selectedDiary },
      archiveEditHadContent: hasDiaryContent(s.selectedDiary),
    }));
  const exitArchiveEdit = () => patch({ archiveEditMode: false });

  const onArchiveEditFieldInput = (field, e) => {
    const val = e.target.value;
    patch((s) => ({ archiveEditDiary: { ...s.archiveEditDiary, [field]: { ...s.archiveEditDiary[field], text: val } } }));
  };
  const onArchiveEditFieldDelete = (field) =>
    patch((s) => ({ archiveEditDiary: { ...s.archiveEditDiary, [field]: { text: "", fromPhoto: false } } }));

  const archiveEditSaveDisabled =
    (!hasDiaryContent(state.archiveEditDiary) && !state.archiveEditHadContent) || state.archiveEditSaving;

  const saveArchiveEdit = async () => {
    const d = state.archiveEditDiary;
    if (!hasDiaryContent(d) && !state.archiveEditHadContent) return;
    const { personId, selectedDate } = state;
    const isToday = selectedDate === getTodayISO();
    patch({ archiveEditSaving: true });
    try {
      const result = await api.saveEntry(personId, selectedDate, {
        doneWell: d.doneWell,
        endured: d.endured,
        wordToMe: d.wordToMe,
      });
      const monthStatus = await api.fetchMonthStatus(personId, toMonthKey(state.archiveYear, state.archiveMonth));
      patch({
        selectedDiary: entryToDiary(result.entry),
        selectedEntryItems: entryToItems(result.entry),
        monthStatus,
        streak: result.streak,
        archiveEditMode: false,
        archiveEditSaving: false,
        ...(isToday
          ? {
              diary: entryToDiary(result.entry),
              todayCompleted: result.completed,
              persistedDiaryHasContent: hasDiaryContent(d),
            }
          : {}),
      });
      if (state.activeGroupCode) {
        api
          .fetchMembers(state.activeGroupCode)
          .then((members) => patch({ members }))
          .catch((err) => console.error(err));
      }
    } catch (err) {
      patch({ archiveEditSaving: false });
      window.alert(err.message || "저장에 실패했어요. 다시 시도해주세요.");
    }
  };

  return (
    <div className="app-shell">
      <SketchyDefs />

      {state.view === "onboarding" && (
        <Onboarding
          onGroupCreate={() => goGroupCreate(false)}
          onGroupJoin={() => goGroupJoin(false)}
          onSolo={goSolo}
          onRecover={goRecover}
        />
      )}

      {state.view === "recover" && (
        <RecoverScreen
          value={state.recoverInputValue}
          submitting={state.recoverSubmitting}
          error={state.recoverError}
          onInput={onRecoverInput}
          onSubmit={submitRecover}
          onBack={backFromRecover}
        />
      )}

      {state.view === "recoveryCode" && (
        <RecoveryCodeScreen
          code={state.recoveryCodeValue}
          loading={state.recoveryCodeLoading}
          error={state.recoveryCodeError}
          copied={state.recoveryCodeCopied}
          onBack={backFromRecoveryCode}
          onCopy={copyRecoveryCode}
        />
      )}

      {state.view === "groupSetup" && (
        <GroupSetup
          groupMode={state.groupMode}
          nameKnown={state.groupSetupNameKnown}
          knownDisplayName={state.displayName}
          groupCreated={state.groupCreated}
          createdGroupCode={state.createdGroupCode}
          groupNameValue={state.groupNameValue}
          memberNameValue={state.memberNameValue}
          joinCodeValue={state.joinCodeValue}
          submitting={state.groupSetupSubmitting}
          error={state.groupSetupError}
          onBack={backFromGroupSetup}
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
                partialSaveNotice={state.partialSaveNotice}
                members={state.members}
                saving={state.saveSubmitting}
                saveDisabled={saveDisabled}
                onFieldInput={onFieldInput}
                onFieldDelete={onFieldDelete}
                onOpenCamera={openCameraForField}
                onSaveDiary={saveDiary}
                onCloseCelebration={closeCelebration}
              />
            )}
            {state.activeTab === "friends" && (
              <FriendsScreen
                members={state.members}
                hasGroup={!!state.activeGroupCode}
                onCreateGroup={() => goGroupCreate(true)}
                onJoinGroup={() => goGroupJoin(true)}
              />
            )}
            {state.activeTab === "feed" && (
              <FeedScreen
                posts={state.feedPosts}
                hasGroup={!!state.activeGroupCode}
                expandedFeed={state.expandedFeed}
                onToggleExpand={toggleExpand}
                onToggleReact={toggleReact}
                onCreateGroup={() => goGroupCreate(true)}
                onJoinGroup={() => goGroupJoin(true)}
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
                editMode={state.archiveEditMode}
                editDiary={state.archiveEditDiary}
                editSaving={state.archiveEditSaving}
                editSaveDisabled={archiveEditSaveDisabled}
                onEnterEdit={enterArchiveEdit}
                onExitEdit={exitArchiveEdit}
                onEditFieldInput={onArchiveEditFieldInput}
                onEditFieldDelete={onArchiveEditFieldDelete}
                onEditOpenCamera={openCameraForArchiveEditField}
                onSaveEdit={saveArchiveEdit}
              />
            )}
          </div>

          <BottomTabBar activeTab={state.activeTab} onSelect={setTab} />
        </div>
      )}

      {state.view === "app" && state.showProfile && (
        <ProfileOverlay
          streak={state.streak}
          displayName={state.displayName}
          myGroups={state.myGroups}
          activeGroupCode={state.activeGroupCode}
          activeGroupName={state.activeGroupName}
          notifyOn={state.notifyOn}
          onClose={closeProfile}
          onToggleNotify={toggleNotify}
          onSwitchGroup={switchActiveGroup}
          onLeaveGroup={leaveActiveGroup}
          onCreateGroup={() => goGroupCreate(true)}
          onJoinGroup={() => goGroupJoin(true)}
          onViewRecoveryCode={goRecoveryCode}
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
