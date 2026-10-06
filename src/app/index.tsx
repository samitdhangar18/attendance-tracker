import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Course {
  id: string;
  name: string;
  type: 'Theory' | 'Practical';
  present: number;
  total: number;
  color: string;
}

interface TimetableSlot {
  id: string;
  time: string;
  subject: string;
  type: 'Theory' | 'Practical';
  room?: string;
}

interface UserProfile {
  name: string;
  college: string;
  degree: 
  semester: string;
}

const STORAGE_KEYS = {
  COURSES: '@attendance_courses_v5',
  TIMETABLE: '@attendance_timetable_v5',
  PROFILE_PIC: '@attendance_profile_pic_v5',
  PROFILE_DATA: '@attendance_profile_data_v5',
  GOAL: '@attendance_goal_v5',
};

const PALETTE = [
  '#00F5A0', // Electric Mint
  '#00E5FF', // Cyber Cyan
  '#FF2A85', // Neon Fuchsia
  '#FFB703', // Radiant Amber
  '#A855F7', // Cyber Violet
  '#38BDF8', // Sky Pulse
  '#F43F5E', // Rose Flare
];

const INITIAL_PROFILE: UserProfile = {
  name: 'Samit',
  college: 'Oriental Institute of Science & Technology',
  degree: 'B.Tech • Computer Science (Data Science)',
  semester: 'Semester V-C',
};

const INITIAL_COURSES: Course[] = [
  { id: '1', name: 'Machine Learning', type: 'Theory', present: 0, total: 0, color: '#00E5FF' },
  { id: '2', name: 'Theory of Computation', type: 'Theory', present: 0, total: 0, color: '#FF2A85' },
  { id: '3', name: 'Computer Org & Architecture', type: 'Theory', present: 0, total: 0, color: '#FFB703' },
  { id: '4', name: 'Data Mining & Warehousing', type: 'Practical', present: 0, total: 0, color: '#A855F7' },
  { id: '5', name: 'Machine Learning Lab', type: 'Practical', present: 0, total: 0, color: '#00F5A0' },
  { id: '6', name: 'Minor Project Review', type: 'Practical', present: 0, total: 0, color: '#38BDF8' },
];

const INITIAL_TIMETABLE: Record<string, TimetableSlot[]> = {
  Mon: [
    { id: 'm1', time: '09:30 - 10:30 AM', subject: 'Machine Learning', type: 'Theory', room: 'Room 301' },
    { id: 'm2', time: '10:30 - 11:30 AM', subject: 'Theory of Computation', type: 'Theory', room: 'Room 301' },
    { id: 'm3', time: '11:30 - 12:30 PM', subject: 'Computer Org & Architecture', type: 'Theory', room: 'Room 302' },
  ],
  Tue: [
    { id: 't1', time: '09:30 - 10:30 AM', subject: 'Data Mining & Warehousing', type: 'Theory', room: 'Room 301' },
    { id: 't2', time: '11:30 - 01:30 PM', subject: 'Machine Learning Lab', type: 'Practical', room: 'Lab 3' },
  ],
  Wed: [
    { id: 'w1', time: '09:30 - 10:30 AM', subject: 'Theory of Computation', type: 'Theory', room: 'Room 301' },
    { id: 'w2', time: '10:30 - 11:30 AM', subject: 'Data Mining & Warehousing', type: 'Theory', room: 'Room 302' },
  ],
  Thu: [
    { id: 'th1', time: '09:30 - 10:30 AM', subject: 'Computer Org & Architecture', type: 'Theory', room: 'Room 301' },
    { id: 'th2', time: '11:30 - 01:30 PM', subject: 'Minor Project Review', type: 'Practical', room: 'Lab 1' },
  ],
  Fri: [
    { id: 'f1', time: '09:30 - 11:30 AM', subject: 'Training & Skill Dev', type: 'Theory', room: 'Auditorium' },
    { id: 'f2', time: '12:00 - 02:00 PM', subject: 'Practical Evaluation', type: 'Practical', room: 'Lab 2' },
  ],
  Sat: [
    { id: 's1', time: '10:00 - 12:00 PM', subject: 'Doubt Clearing & Labs', type: 'Practical', room: 'Lab 4' },
  ],
};

export default function AttendanceTrackerApp() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [timetable, setTimetable] = useState<Record<string, TimetableSlot[]>>(INITIAL_TIMETABLE);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [targetGoal, setTargetGoal] = useState<number>(75);
  const [activeTab, setActiveTab] = useState<'Classes' | 'Schedule' | 'Target Planner' | 'Manage'>('Classes');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Modals
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editSemester, setEditSemester] = useState('');

  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [subNameInput, setSubNameInput] = useState('');
  const [subTypeInput, setSubTypeInput] = useState<'Theory' | 'Practical'>('Theory');
  const [subColorInput, setSubColorInput] = useState(PALETTE[0]);

  const [selectedDay, setSelectedDay] = useState('Mon');
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotTimeInput, setSlotTimeInput] = useState('');
  const [slotSubjectInput, setSlotSubjectInput] = useState('');
  const [slotTypeInput, setSlotTypeInput] = useState<'Theory' | 'Practical'>('Theory');
  const [slotRoomInput, setSlotRoomInput] = useState('');

  // Load Saved Data
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [savedCourses, savedTimetable, savedProfile, savedProfilePic, savedGoal] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.COURSES),
          AsyncStorage.getItem(STORAGE_KEYS.TIMETABLE),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_PIC),
          AsyncStorage.getItem(STORAGE_KEYS.GOAL),
        ]);

        if (savedCourses) setCourses(JSON.parse(savedCourses));
        if (savedTimetable) setTimetable(JSON.parse(savedTimetable));
        if (savedProfile) setProfile(JSON.parse(savedProfile));
        if (savedProfilePic) setProfileImage(savedProfilePic);
        if (savedGoal) setTargetGoal(Number(savedGoal));
      } catch (e) {
        console.error('Storage load failed', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadStoredData();
  }, []);

  // Save changes
  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }, [courses, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(timetable));
  }, [timetable, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(profile));
  }, [profile, isLoaded]);

  useEffect(() => {
    if (isLoaded) AsyncStorage.setItem(STORAGE_KEYS.GOAL, targetGoal.toString());
  }, [targetGoal, isLoaded]);

  // Profile Image Picker
  const pickProfileImage = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      Alert.alert('Permission Denied', 'Gallery access is needed to set a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_PIC, uri);
    }
  };

  // Save Profile Details
  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setProfile({
      name: editName.trim(),
      college: editCollege.trim(),
      degree: editDegree.trim(),
      semester: editSemester.trim(),
    });
    setProfileModalVisible(false);
  };

  const openProfileEdit = () => {
    setEditName(profile.name);
    setEditCollege(profile.college);
    setEditDegree(profile.degree);
    setEditSemester(profile.semester);
    setProfileModalVisible(true);
  };

  // Dynamic Mathematical Calculations
  const stats = useMemo(() => {
    const totalConducted = courses.reduce((acc, c) => acc + Number(c.total || 0), 0);
    const totalPresent = courses.reduce((acc, c) => acc + Number(c.present || 0), 0);
    const totalAbsent = Math.max(0, totalConducted - totalPresent);

    // Present Percentage (Total Present / Total Conducted)
    const presentPct = totalConducted === 0 ? 0 : (totalPresent / totalConducted) * 100;

    // Average Percentage Across All Subjects with at least 1 class
    const coursesWithClasses = courses.filter((c) => c.total > 0);
    const avgPct =
      coursesWithClasses.length === 0
        ? 0
        : coursesWithClasses.reduce((acc, c) => acc + (c.present / c.total) * 100, 0) /
          coursesWithClasses.length;

    return {
      totalConducted,
      totalPresent,
      totalAbsent,
      presentPct: presentPct.toFixed(1),
      avgPct: avgPct.toFixed(1),
    };
  }, [courses]);

  // Stepper Modifier
  const updateCount = (id: string, field: 'present' | 'total', delta: number) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        let newPresent = c.present;
        let newTotal = c.total;

        if (field === 'present') {
          newPresent = Math.max(0, c.present + delta);
          if (newPresent > newTotal) newTotal = newPresent;
        } else {
          newTotal = Math.max(0, c.total + delta);
          if (newPresent > newTotal) newPresent = newTotal;
        }

        return { ...c, present: newPresent, total: newTotal };
      })
    );
  };

  // Target Attendance Math (Bunk or Attend more)
  const calculateGoalAdvice = (present: number, total: number, target: number) => {
    if (total === 0) return { status: 'none', count: 0 };
    const currentPct = (present / total) * 100;
    const targetDec = target / 100;

    if (currentPct >= target) {
      const canBunk = Math.floor((present - targetDec * total) / targetDec);
      return { status: 'safe', count: canBunk };
    } else {
      const needToAttend = Math.ceil((targetDec * total - present) / (1 - targetDec));
      return { status: 'short', count: needToAttend };
    }
  };

  // Subject CRUD
  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourseId(course.id);
      setSubNameInput(course.name);
      setSubTypeInput(course.type);
      setSubColorInput(course.color);
    } else {
      setEditingCourseId(null);
      setSubNameInput('');
      setSubTypeInput('Theory');
      setSubColorInput(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    }
    setCourseModalVisible(true);
  };

  const handleSaveCourse = () => {
    if (!subNameInput.trim()) {
      Alert.alert('Required', 'Please enter a subject name.');
      return;
    }

    if (editingCourseId) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourseId
            ? { ...c, name: subNameInput.trim(), type: subTypeInput, color: subColorInput }
            : c
        )
      );
    } else {
      const newCourse: Course = {
        id: Date.now().toString(),
        name: subNameInput.trim(),
        type: subTypeInput,
        present: 0,
        total: 0,
        color: subColorInput,
      };
      setCourses((prev) => [...prev, newCourse]);
    }
    setCourseModalVisible(false);
  };

  const handleDeleteCourse = (id: string, name: string) => {
    Alert.alert('Delete Subject', `Delete "${name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setCourses((prev) => prev.filter((c) => c.id !== id)),
      },
    ]);
  };

  // Timetable CRUD
  const openSlotModal = (slot?: TimetableSlot) => {
    if (slot) {
      setEditingSlotId(slot.id);
      setSlotTimeInput(slot.time);
      setSlotSubjectInput(slot.subject);
      setSlotTypeInput(slot.type);
      setSlotRoomInput(slot.room || '');
    } else {
      setEditingSlotId(null);
      setSlotTimeInput('');
      setSlotSubjectInput('');
      setSlotTypeInput('Theory');
      setSlotRoomInput('');
    }
    setSlotModalVisible(true);
  };

  const handleSaveSlot = () => {
    if (!slotTimeInput.trim() || !slotSubjectInput.trim()) {
      Alert.alert('Missing Fields', 'Time range and subject name are required.');
      return;
    }

    if (editingSlotId) {
      setTimetable((prev) => ({
        ...prev,
        [selectedDay]: (prev[selectedDay] || []).map((s) =>
          s.id === editingSlotId
            ? {
                ...s,
                time: slotTimeInput.trim(),
                subject: slotSubjectInput.trim(),
                type: slotTypeInput,
                room: slotRoomInput.trim(),
              }
            : s
        ),
      }));
    } else {
      const newSlot: TimetableSlot = {
        id: Date.now().toString(),
        time: slotTimeInput.trim(),
        subject: slotSubjectInput.trim(),
        type: slotTypeInput,
        room: slotRoomInput.trim() || undefined,
      };
      setTimetable((prev) => ({
        ...prev,
        [selectedDay]: [...(prev[selectedDay] || []), newSlot],
      }));
    }
    setSlotModalVisible(false);
  };

  const handleDeleteSlot = (day: string, slotId: string) => {
    Alert.alert('Remove Class', 'Delete this lecture from the schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTimetable((prev) => ({
            ...prev,
            [day]: prev[day].filter((s) => s.id !== slotId),
          }));
        },
      },
    ]);
  };

  if (!isLoaded) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00F5A0" />
      </SafeAreaView>
    );
  }

  const overallAdvice = calculateGoalAdvice(stats.totalPresent, stats.totalConducted, targetGoal);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#060913" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openProfileEdit} style={styles.headerProfileBtn} activeOpacity={0.8}>
          <TouchableOpacity onPress={pickProfileImage} style={styles.avatarWrap}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{profile.name.substring(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraIconDot}>
              <Feather name="camera" size={10} color="#060913" />
            </View>
          </TouchableOpacity>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerName}>{profile.name}</Text>
              <Feather name="edit-2" size={12} color="#00E5FF" />
            </View>
            <Text style={styles.headerSemester}>{profile.semester}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Alert.alert('Reset Attendance', 'Set all present & total counts back to 0?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: () => setCourses((prev) => prev.map((c) => ({ ...c, present: 0, total: 0 }))),
              },
            ]);
          }}
          style={styles.headerResetBtn}
        >
          <Ionicons name="refresh-outline" size={18} color="#FF2A85" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Student Information Banner */}
        <View style={styles.profileBanner}>
          <View style={styles.profileBannerTop}>
            <View style={styles.verifiedTag}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#00F5A0" />
              <Text style={styles.verifiedTagText}>OFFLINE SAVED</Text>
            </View>
            <TouchableOpacity onPress={openProfileEdit} style={styles.editBioBtn}>
              <Feather name="edit-3" size={12} color="#00E5FF" />
              <Text style={styles.editBioBtnText}>Edit Info</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.collegeText} numberOfLines={1}>{profile.college}</Text>
          <Text style={styles.degreeText} numberOfLines={1}>{profile.degree}</Text>

          {/* Quick Safe Bunk Summary */}
          <View
            style={[
              styles.targetStatusBox,
              { borderColor: overallAdvice.status === 'safe' ? '#00F5A0' : '#FF2A85' },
            ]}
          >
            <FontAwesome5
              name={overallAdvice.status === 'safe' ? 'check-circle' : 'exclamation-circle'}
              size={15}
              color={overallAdvice.status === 'safe' ? '#00F5A0' : '#FF2A85'}
            />
            <Text style={styles.targetStatusBoxText}>
              {overallAdvice.status === 'safe'
                ? `Safe Zone: You can bunk next ${overallAdvice.count} class(es) maintaining ${targetGoal}% target.`
                : `Shortage Alert: Attend next ${overallAdvice.count} lecture(s) continuously to reach ${targetGoal}%.`}
            </Text>
          </View>
        </View>

        {/* 4 KPI Metrics: Present %, Average %, Total Present, Total Absent */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderColor: 'rgba(0, 245, 160, 0.35)' }]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>PRESENT %</Text>
              <MaterialCommunityIcons name="percent" size={15} color="#00F5A0" />
            </View>
            <Text style={[styles.kpiValue, { color: '#00F5A0' }]}>{stats.presentPct}%</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: 'rgba(0, 229, 255, 0.35)' }]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>AVERAGE %</Text>
              <MaterialCommunityIcons name="chart-line" size={15} color="#00E5FF" />
            </View>
            <Text style={[styles.kpiValue, { color: '#00E5FF' }]}>{stats.avgPct}%</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: 'rgba(255, 183, 3, 0.35)' }]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>ATTENDED</Text>
              <Ionicons name="checkmark-done" size={15} color="#FFB703" />
            </View>
            <Text style={[styles.kpiValue, { color: '#FFB703' }]}>{stats.totalPresent}</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: 'rgba(255, 42, 133, 0.35)' }]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>MISSED</Text>
              <Ionicons name="close" size={15} color="#FF2A85" />
            </View>
            <Text style={[styles.kpiValue, { color: '#FF2A85' }]}>{stats.totalAbsent}</Text>
          </View>
        </View>

        {/* Interactive Target Goal Customizer */}
        <View style={styles.targetAdjustCard}>
          <View style={styles.targetAdjustHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="target" size={18} color="#FFB703" />
              <Text style={styles.targetAdjustTitle}>Target Attendance Threshold</Text>
            </View>
            <View style={styles.targetValueBadge}>
              <Text style={styles.targetValueBadgeText}>{targetGoal}%</Text>
            </View>
          </View>

          <Text style={styles.targetAdjustSub}>Tap or customize your institutional target:</Text>

          <View style={styles.targetBtnRow}>
            {[65, 75, 80, 85, 90].map((goal) => (
              <TouchableOpacity
                key={goal}
                onPress={() => setTargetGoal(goal)}
                style={[styles.targetChoiceBtn, targetGoal === goal && styles.targetChoiceBtnActive]}
              >
                <Text
                  style={[
                    styles.targetChoiceText,
                    targetGoal === goal && styles.targetChoiceTextActive,
                  ]}
                >
                  {goal}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabContainer}>
          {(['Classes', 'Schedule', 'Target Planner', 'Manage'] as const).map((tab) => {
            const isTabActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isTabActive && styles.tabButtonActive]}
              >
                <Text style={[styles.tabButtonText, isTabActive && styles.tabButtonTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: CLASSES */}
        {activeTab === 'Classes' && (
          <View style={{ gap: 14 }}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="book-open-page-variant" size={18} color="#00F5A0" />
                <Text style={styles.sectionTitle}>Tracked Subjects ({courses.length})</Text>
              </View>
              <TouchableOpacity onPress={() => openCourseModal()} style={styles.primaryAddBtn}>
                <Ionicons name="add" size={16} color="#060913" />
                <Text style={styles.primaryAddBtnText}>Add Subject</Text>
              </TouchableOpacity>
            </View>

            {courses.map((course) => {
              const subPct = course.total === 0 ? 0 : (course.present / course.total) * 100;
              const isBelow = subPct < targetGoal && course.total > 0;

              return (
                <View key={course.id} style={[styles.courseCard, { borderLeftColor: course.color }]}>
                  <View style={styles.courseCardTop}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.courseName}>{course.name}</Text>
                      <View style={styles.courseTypeBadge}>
                        <MaterialCommunityIcons
                          name={course.type === 'Practical' ? 'flask-outline' : 'laptop'}
                          size={11}
                          color="#94A3B8"
                        />
                        <Text style={styles.courseTypeBadgeText}>{course.type}</Text>
                      </View>
                    </View>

                    <View style={styles.courseStatsRight}>
                      <Text
                        style={[
                          styles.coursePctText,
                          { color: isBelow ? '#FF2A85' : '#00F5A0' },
                        ]}
                      >
                        {subPct.toFixed(1)}%
                      </Text>
                      <TouchableOpacity
                        onPress={() => openCourseModal(course)}
                        style={styles.cardEditIconBtn}
                      >
                        <Feather name="edit-2" size={13} color="#00E5FF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Line */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, subPct)}%`,
                          backgroundColor: course.color,
                        },
                      ]}
                    />
                  </View>

                  {/* Stepper Controls */}
                  <View style={styles.stepperContainer}>
                    <View style={styles.stepperBox}>
                      <Text style={styles.stepperLabel}>Present</Text>
                      <View style={styles.stepperActionGroup}>
                        <TouchableOpacity
                          onPress={() => updateCount(course.id, 'present', -1)}
                          style={styles.stepBtnMinus}
                        >
                          <Ionicons name="remove" size={14} color="#94A3B8" />
                        </TouchableOpacity>
                        <Text style={styles.stepNumberText}>{course.present}</Text>
                        <TouchableOpacity
                          onPress={() => updateCount(course.id, 'present', 1)}
                          style={styles.stepBtnPlus}
                        >
                          <Ionicons name="add" size={14} color="#00F5A0" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.stepperBox}>
                      <Text style={styles.stepperLabel}>Total Held</Text>
                      <View style={styles.stepperActionGroup}>
                        <TouchableOpacity
                          onPress={() => updateCount(course.id, 'total', -1)}
                          style={styles.stepBtnMinus}
                        >
                          <Ionicons name="remove" size={14} color="#94A3B8" />
                        </TouchableOpacity>
                        <Text style={styles.stepNumberText}>{course.total}</Text>
                        <TouchableOpacity
                          onPress={() => updateCount(course.id, 'total', 1)}
                          style={[styles.stepBtnPlus, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}
                        >
                          <Ionicons name="add" size={14} color="#00E5FF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'Schedule' && (
          <View style={{ gap: 14 }}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="calendar-month" size={18} color="#FFB703" />
                <Text style={styles.sectionTitle}>Weekly Lecture Schedule</Text>
              </View>
              <TouchableOpacity onPress={() => openSlotModal()} style={styles.primaryAddBtn}>
                <Ionicons name="add" size={16} color="#060913" />
                <Text style={styles.primaryAddBtnText}>Add Class</Text>
              </TouchableOpacity>
            </View>

            {/* Day Switcher */}
            <View style={styles.daySelectorRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                const isDaySelected = selectedDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[styles.dayChoiceBtn, isDaySelected && styles.dayChoiceBtnActive]}
                  >
                    <Text
                      style={[
                        styles.dayChoiceText,
                        isDaySelected && styles.dayChoiceTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {(!timetable[selectedDay] || timetable[selectedDay].length === 0) ? (
              <View style={styles.emptyCard}>
                <Feather name="coffee" size={32} color="#64748B" />
                <Text style={styles.emptyCardTitle}>No lectures scheduled on {selectedDay}</Text>
                <TouchableOpacity onPress={() => openSlotModal()} style={styles.emptyAddBtn}>
                  <Text style={styles.emptyAddBtnText}>+ Add Period</Text>
                </TouchableOpacity>
              </View>
            ) : (
              timetable[selectedDay].map((slot) => (
                <View key={slot.id} style={styles.slotCard}>
                  <View style={styles.slotCardHeader}>
                    <View style={styles.slotTimeBadge}>
                      <Ionicons name="time-outline" size={13} color="#00F5A0" />
                      <Text style={styles.slotTimeText}>{slot.time}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity onPress={() => openSlotModal(slot)} style={styles.slotActionBtn}>
                        <Feather name="edit-2" size={13} color="#00E5FF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSlot(selectedDay, slot.id)}
                        style={styles.slotActionBtn}
                      >
                        <Ionicons name="trash-outline" size={14} color="#FF2A85" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.slotSubjectTitle}>{slot.subject}</Text>

                  <View style={styles.slotFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <MaterialCommunityIcons name="door-open" size={13} color="#94A3B8" />
                      <Text style={styles.slotRoomText}>{slot.room || 'Main Classroom'}</Text>
                    </View>
                    <View style={styles.slotTypeBadge}>
                      <Text style={styles.slotTypeBadgeText}>{slot.type}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: TARGET PLANNER */}
        {activeTab === 'Target Planner' && (
          <View style={{ gap: 14 }}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="shield-airplane-outline" size={18} color="#00E5FF" />
                <Text style={styles.sectionTitle}>Safe Bunk & Attendance Recovery</Text>
              </View>
            </View>

            {courses.map((course) => {
              const advice = calculateGoalAdvice(course.present, course.total, targetGoal);
              const pct = course.total === 0 ? 0 : (course.present / course.total) * 100;

              return (
                <View key={course.id} style={styles.plannerCard}>
                  <View style={styles.plannerCardTop}>
                    <Text style={styles.plannerSubjectName}>{course.name}</Text>
                    <Text
                      style={[
                        styles.plannerPctText,
                        { color: pct >= targetGoal ? '#00F5A0' : '#FF2A85' },
                      ]}
                    >
                      {pct.toFixed(1)}%
                    </Text>
                  </View>

                  <View style={styles.plannerAdviceBox}>
                    <FontAwesome5
                      name={advice.status === 'safe' ? 'umbrella-beach' : 'running'}
                      size={13}
                      color={advice.status === 'safe' ? '#00F5A0' : '#FF2A85'}
                    />
                    <Text style={styles.plannerAdviceText}>
                      {course.total === 0
                        ? 'No class attendance marked yet.'
                        : advice.status === 'safe'
                        ? `Safe Zone: You can safely bunk ${advice.count} more class(es).`
                        : `Shortage Alert: Must attend next ${advice.count} lecture(s) continuously.`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 4: MANAGE */}
        {activeTab === 'Manage' && (
          <View style={{ gap: 14 }}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="tune" size={18} color="#A855F7" />
                <Text style={styles.sectionTitle}>Curriculum & Subject Setup</Text>
              </View>
              <TouchableOpacity onPress={() => openCourseModal()} style={styles.primaryAddBtn}>
                <Ionicons name="add" size={16} color="#060913" />
                <Text style={styles.primaryAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {courses.map((course) => (
              <View key={course.id} style={styles.manageCardRow}>
                <View style={[styles.paletteDot, { backgroundColor: course.color }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.manageCardTitle}>{course.name}</Text>
                  <Text style={styles.manageCardMeta}>
                    {course.type} • {course.present}/{course.total} Attended
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => openCourseModal(course)}
                    style={styles.manageActionBtn}
                  >
                    <Feather name="edit-2" size={14} color="#00E5FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCourse(course.id, course.name)}
                    style={[styles.manageActionBtn, { backgroundColor: 'rgba(255, 42, 133, 0.15)' }]}
                  >
                    <Ionicons name="trash-outline" size={14} color="#FF2A85" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: EDIT PROFILE */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Student Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Student Name</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Samit"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>College / Institute</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editCollege}
              onChangeText={setEditCollege}
              placeholder="e.g. Oriental Institute of Science & Technology"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Degree & Branch</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editDegree}
              onChangeText={setEditDegree}
              placeholder="e.g. B.Tech • Computer Science (Data Science)"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Semester</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editSemester}
              onChangeText={setEditSemester}
              placeholder="e.g. Semester V-C"
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity onPress={handleSaveProfile} style={styles.modalSaveBtn}>
              <Ionicons name="save" size={18} color="#060913" />
              <Text style={styles.modalSaveBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ADD / EDIT SUBJECT */}
      <Modal visible={courseModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCourseId ? 'Edit Subject' : 'Add New Subject'}
              </Text>
              <TouchableOpacity onPress={() => setCourseModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Subject Name</Text>
            <TextInput
              style={styles.modalTextInput}
              value={subNameInput}
              onChangeText={setSubNameInput}
              placeholder="e.g. Machine Learning"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Course Type</Text>
            <View style={styles.toggleRow}>
              {(['Theory', 'Practical'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSubTypeInput(type)}
                  style={[styles.toggleBtn, subTypeInput === type && styles.toggleBtnActive]}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      subTypeInput === type && styles.toggleBtnTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Accent Theme Color</Text>
            <View style={styles.colorPaletteGrid}>
              {PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSubColorInput(color)}
                  style={[
                    styles.paletteChip,
                    { backgroundColor: color },
                    subColorInput === color && styles.paletteChipActive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity onPress={handleSaveCourse} style={styles.modalSaveBtn}>
              <Ionicons name="save" size={18} color="#060913" />
              <Text style={styles.modalSaveBtnText}>
                {editingCourseId ? 'Update Subject' : 'Save Subject'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ADD / EDIT SCHEDULE */}
      <Modal visible={slotModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSlotId ? 'Edit Period Slot' : `Add Class to ${selectedDay}`}
              </Text>
              <TouchableOpacity onPress={() => setSlotModalVisible(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Time Interval</Text>
            <TextInput
              style={styles.modalTextInput}
              value={slotTimeInput}
              onChangeText={setSlotTimeInput}
              placeholder="e.g. 09:30 - 10:30 AM"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Subject Name</Text>
            <TextInput
              style={styles.modalTextInput}
              value={slotSubjectInput}
              onChangeText={setSlotSubjectInput}
              placeholder="e.g. Machine Learning"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Room / Lab Number</Text>
            <TextInput
              style={styles.modalTextInput}
              value={slotRoomInput}
              onChangeText={setSlotRoomInput}
              placeholder="e.g. Room 301 / Lab 2"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.toggleRow}>
              {(['Theory', 'Practical'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSlotTypeInput(type)}
                  style={[styles.toggleBtn, slotTypeInput === type && styles.toggleBtnActive]}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      slotTypeInput === type && styles.toggleBtnTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleSaveSlot} style={styles.modalSaveBtn}>
              <Ionicons name="save" size={18} color="#060913" />
              <Text style={styles.modalSaveBtnText}>Save Period</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#060913',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0C1122',
    borderBottomWidth: 1,
    borderColor: '#17223D',
  },
  headerProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#00F5A0',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#17223D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00F5A0',
  },
  avatarFallbackText: {
    color: '#00F5A0',
    fontSize: 16,
    fontWeight: '900',
  },
  cameraIconDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00F5A0',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSemester: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  headerResetBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#17223D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileBanner: {
    backgroundColor: '#0C1122',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2C4E',
    marginBottom: 16,
  },
  profileBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedTagText: {
    color: '#00F5A0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editBioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBioBtnText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
  },
  collegeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  degreeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  targetStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#060913',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  targetStatusBoxText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#0C1122',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },
  targetAdjustCard: {
    backgroundColor: '#0C1122',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2C4E',
    marginBottom: 16,
  },
  targetAdjustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetAdjustTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  targetValueBadge: {
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  targetValueBadgeText: {
    color: '#FFB703',
    fontWeight: '900',
    fontSize: 12,
  },
  targetAdjustSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    marginBottom: 10,
  },
  targetBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  targetChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#17223D',
    borderRadius: 8,
    alignItems: 'center',
  },
  targetChoiceBtnActive: {
    backgroundColor: '#FFB703',
  },
  targetChoiceText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  targetChoiceTextActive: {
    color: '#060913',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0C1122',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E2C4E',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#17223D',
  },
  tabButtonText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#00F5A0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F5A0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  primaryAddBtnText: {
    color: '#060913',
    fontWeight: '900',
    fontSize: 11,
  },
  courseCard: {
    backgroundColor: '#0C1122',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2C4E',
    borderLeftWidth: 4,
  },
  courseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  courseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#17223D',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  courseTypeBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  courseStatsRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  coursePctText: {
    fontSize: 16,
    fontWeight: '900',
  },
  cardEditIconBtn: {
    padding: 4,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#17223D',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepperContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  stepperBox: {
    flex: 1,
    backgroundColor: '#060913',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#17223D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  stepperActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtnMinus: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#17223D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnPlus: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#0C1122',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2C4E',
  },
  dayChoiceBtnActive: {
    backgroundColor: '#FFB703',
    borderColor: '#FFB703',
  },
  dayChoiceText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  dayChoiceTextActive: {
    color: '#060913',
  },
  emptyCard: {
    backgroundColor: '#0C1122',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2C4E',
    gap: 8,
  },
  emptyCardTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyAddBtn: {
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#00F5A0',
    fontSize: 12,
    fontWeight: '800',
  },
  slotCard: {
    backgroundColor: '#0C1122',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2C4E',
  },
  slotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 245, 160, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotTimeText: {
    color: '#00F5A0',
    fontSize: 11,
    fontWeight: '700',
  },
  slotActionBtn: {
    padding: 4,
  },
  slotSubjectTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  slotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#17223D',
    paddingTop: 8,
  },
  slotRoomText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  slotTypeBadge: {
    backgroundColor: '#17223D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotTypeBadgeText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '700',
  },
  plannerCard: {
    backgroundColor: '#0C1122',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2C4E',
  },
  plannerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plannerSubjectName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    flex: 1,
  },
  plannerPctText: {
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },
  plannerAdviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#060913',
    borderRadius: 8,
    padding: 8,
  },
  plannerAdviceText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  manageCardRow: {
    backgroundColor: '#0C1122',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2C4E',
  },
  paletteDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  manageCardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  manageCardMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  manageActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#17223D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#0C1122',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E2C4E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#060913',
    borderWidth: 1,
    borderColor: '#1E2C4E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: '#060913',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2C4E',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    borderColor: '#00F5A0',
  },
  toggleBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#00F5A0',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  paletteChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  paletteChipActive: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  modalSaveBtn: {
    backgroundColor: '#00F5A0',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  modalSaveBtnText: {
    color: '#060913',
    fontWeight: '900',
    fontSize: 13,
  },
});
