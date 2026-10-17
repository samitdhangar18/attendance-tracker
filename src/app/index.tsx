import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

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
  degree: string;
  semester: string;
}

const DEFAULT_TIMETABLE_IMG = require('../../assets/timetable.png');

const STORAGE_KEYS = {
  COURSES: '@attendance_courses_v5',
  TIMETABLE: '@attendance_timetable_v5',
  PROFILE_PIC: '@attendance_profile_pic_v5',
  PROFILE_DATA: '@attendance_profile_data_v5',
  GOAL: '@attendance_goal_v5',
  TIMETABLE_IMG: '@attendance_timetable_img_v6',
};

const PALETTE = [
  '#18A77A', // Electric Mint
  '#3778D5', // Cyber Cyan
  '#E45C70', // Neon Fuchsia
  '#D68B16', // Radiant Amber
  '#8359D1', // Cyber Violet
  '#2996B8', // Sky Pulse
  '#D95768', // Rose Flare
];

const INITIAL_PROFILE: UserProfile = {
  name: 'Samit',
  college: 'Oriental Institute of Science & Technology',
  degree: 'B.Tech • Computer Science (Data Science)',
  semester: 'Semester V-C',
};

const INITIAL_COURSES: Course[] = [
  { id: '1', name: 'Machine Learning (ML)', type: 'Theory', present: 0, total: 0, color: '#3778D5' },
  { id: '2', name: 'Theory of Computation (ToC)', type: 'Theory', present: 0, total: 0, color: '#E45C70' },
  { id: '3', name: 'Computer Org & Architecture (COA)', type: 'Theory', present: 0, total: 0, color: '#D68B16' },
  { id: '4', name: 'Data Mining & Warehousing (DMW)', type: 'Theory', present: 0, total: 0, color: '#8359D1' },
  { id: '5', name: 'CRT', type: 'Theory', present: 0, total: 0, color: '#2996B8' },
  { id: '6', name: 'ML Lab', type: 'Practical', present: 0, total: 0, color: '#18A77A' },
  { id: '7', name: 'COA Lab', type: 'Practical', present: 0, total: 0, color: '#3778D5' },
  { id: '8', name: 'ToC Lab', type: 'Practical', present: 0, total: 0, color: '#E45C70' },
  { id: '9', name: 'DMW Lab', type: 'Practical', present: 0, total: 0, color: '#8359D1' },
  { id: '10', name: 'Minor Project', type: 'Practical', present: 0, total: 0, color: '#D68B16' },
];

const INITIAL_TIMETABLE: Record<string, TimetableSlot[]> = {
  Mon: [
    { id: 'm1', time: '10:00 - 10:50 AM', subject: 'DMW', type: 'Theory', room: 'Faculty: VC' },
    { id: 'm2', time: '10:50 - 11:40 AM', subject: 'COA', type: 'Theory', room: 'Faculty: AB' },
    { id: 'm3', time: '11:40 - 12:30 PM', subject: 'ML', type: 'Theory', room: 'Faculty: Swati mam' },
    { id: 'm4', time: '12:30 - 01:20 PM', subject: 'ToC', type: 'Theory', room: 'Faculty: SB' },
    { id: 'm5', time: '02:00 - 03:40 PM', subject: 'ML Lab (G1) / Minor (G2)', type: 'Practical', room: 'ACL Lab 1 / Lab' },
    { id: 'm6', time: '03:40 - 04:30 PM', subject: 'DMW', type: 'Theory', room: 'Faculty: VC' },
  ],
  Tue: [
    { id: 't1', time: '10:00 - 10:50 AM', subject: 'DMW', type: 'Theory', room: 'Faculty: VC' },
    { id: 't2', time: '10:50 - 11:40 AM', subject: 'ML', type: 'Theory', room: 'Faculty: Swati mam' },
    { id: 't3', time: '11:40 - 01:20 PM', subject: 'CRT', type: 'Theory', room: 'Faculty: CC' },
    { id: 't4', time: '02:00 - 02:50 PM', subject: 'COA', type: 'Theory', room: 'Faculty: AB' },
    { id: 't5', time: '02:50 - 04:30 PM', subject: 'ToC Lab (G1) / COA Lab (G2)', type: 'Practical', room: 'Wipro Lab 4 / DS Lab 2' },
  ],
  Wed: [
    { id: 'w1', time: '10:00 - 11:40 AM', subject: 'COA Lab (G1) / ToC Lab (G2)', type: 'Practical', room: 'DS Lab 2 / Wipro Lab 5' },
    { id: 'w2', time: '11:40 - 12:30 PM', subject: 'COA', type: 'Theory', room: 'Faculty: AB' },
    { id: 'w3', time: '12:30 - 01:20 PM', subject: 'ML', type: 'Theory', room: 'Faculty: Swati mam' },
    { id: 'w4', time: '02:00 - 02:50 PM', subject: 'ToC', type: 'Theory', room: 'Faculty: SB' },
    { id: 'w5', time: '02:50 - 04:30 PM', subject: 'DMW Lab (G1) / ML Lab (G2)', type: 'Practical', room: 'ACL Lab 1 / Wipro Lab 5' },
  ],
  Thu: [
    { id: 'th1', time: '10:00 - 10:50 AM', subject: 'ML', type: 'Theory', room: 'Faculty: Swati mam' },
    { id: 'th2', time: '10:50 - 11:40 AM', subject: 'ToC', type: 'Theory', room: 'Faculty: SB' },
    { id: 'th3', time: '11:40 - 01:20 PM', subject: 'CRT', type: 'Theory', room: 'Faculty: CC' },
    { id: 'th4', time: '02:00 - 02:50 PM', subject: 'DMW', type: 'Theory', room: 'Faculty: VC' },
    { id: 'th5', time: '02:50 - 03:40 PM', subject: 'COA', type: 'Theory', room: 'Faculty: AB' },
    { id: 'th6', time: '03:40 - 04:30 PM', subject: 'ToC', type: 'Theory', room: 'Faculty: SB' },
  ],
  Fri: [
    { id: 'f1', time: '10:00 - 10:50 AM', subject: 'ML', type: 'Theory', room: 'Faculty: Swati mam' },
    { id: 'f2', time: '10:50 - 11:40 AM', subject: 'ToC', type: 'Theory', room: 'Faculty: SB' },
    { id: 'f3', time: '11:40 - 01:20 PM', subject: 'CRT', type: 'Theory', room: 'Faculty: CC' },
    { id: 'f4', time: '02:00 - 02:50 PM', subject: 'COA', type: 'Theory', room: 'Faculty: AB' },
    { id: 'f5', time: '02:50 - 03:40 PM', subject: 'Library (L)', type: 'Theory', room: 'Library' },
    { id: 'f6', time: '03:40 - 04:30 PM', subject: 'DMW', type: 'Theory', room: 'Faculty: VC' },
  ],
  Sat: [
    { id: 's1', time: '10:00 - 10:50 AM', subject: 'DMW', type: 'Theory', room: 'Faculty: VC' },
    { id: 's2', time: '10:50 - 11:40 AM', subject: 'ToC', type: 'Theory', room: 'Faculty: SB' },
    { id: 's3', time: '11:40 - 12:30 PM', subject: 'ML', type: 'Theory', room: 'Faculty: Swati mam' },
    { id: 's4', time: '12:30 - 01:20 PM', subject: 'COA', type: 'Theory', room: 'Faculty: AB' },
    { id: 's5', time: '02:00 - 03:40 PM', subject: 'Minor (G1) / DMW Lab (G2)', type: 'Practical', room: 'Lab' },
    { id: 's6', time: '03:40 - 04:30 PM', subject: 'COA', type: 'Theory', room: 'Faculty: AB' },
  ],
};

const round2 = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

function CircularProgress({
  percentage,
  color,
  size = 46,
  strokeWidth = 4.5,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text
          style={{
            fontSize: size >= 70 ? 12 : 8,
            fontWeight: '800',
            color: '#1E293B',
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {round2(percentage).toFixed(2)}%
        </Text>
      </View>
    </View>
  );
}

function CollegeBuildingGraphic() {
  return (
    <View style={styles.collegeBuildingBadge}>
      <Svg width={72} height={60} viewBox="0 0 68 58" fill="none">
        <Path d="M34 52 L58 40 L34 28 L10 40 Z" fill="#E2E8F0" />
        <Path d="M10 40 L34 52 L34 55 L10 43 Z" fill="#CBD5E1" />
        <Path d="M34 52 L58 40 L58 43 L34 55 Z" fill="#94A3B8" />
        <Path d="M24 20 L34 25 L34 45 L24 40 Z" fill="#3B82F6" />
        <Path d="M34 25 L44 20 L44 40 L34 45 Z" fill="#60A5FA" />
        <Path d="M34 14 L44 20 L34 25 L24 20 Z" fill="#93C5FD" />
        <Path d="M26 26 L29 28 L29 31 L26 29 Z" fill="#FFFFFF" />
        <Path d="M26 33 L29 35 L29 38 L26 36 Z" fill="#FFFFFF" />
        <Path d="M38 28 L41 26 L41 29 L38 31 Z" fill="#FFFFFF" />
        <Path d="M38 35 L41 33 L41 36 L38 38 Z" fill="#FFFFFF" />
        <Path d="M32 8 L36 10 L34 14 Z" fill="#1D4ED8" />
        <Circle cx="17" cy="38" r="5" fill="#10B981" />
        <Circle cx="51" cy="38" r="5" fill="#10B981" />
        <Circle cx="14" cy="41" r="3.5" fill="#059669" />
        <Circle cx="54" cy="41" r="3.5" fill="#059669" />
      </Svg>
    </View>
  );
}

function BookStackGraphic() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="16" width="20" height="5" rx="2.5" fill="#3B82F6" />
      <Rect x="3.5" y="10" width="17" height="5" rx="2.5" fill="#F59E0B" />
      <Rect x="5" y="4" width="14" height="5" rx="2.5" fill="#EC4899" />
      <Path d="M4 18.5 H7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M5.5 12.5 H8.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M7 6.5 H10" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function getSubjectIcon(name: string): any {
  const lower = name.toLowerCase();
  if (lower.includes('machine') || lower.includes('ai') || lower.includes('ml')) {
    return 'brain';
  }
  if (lower.includes('data') || lower.includes('mining') || lower.includes('dmw') || lower.includes('sql')) {
    return 'database';
  }
  if (lower.includes('arch') || lower.includes('computer') || lower.includes('coa') || lower.includes('micro')) {
    return 'cpu-64-bit';
  }
  if (lower.includes('theory') || lower.includes('toc') || lower.includes('computation')) {
    return 'code-tags';
  }
  if (lower.includes('network') || lower.includes('cn') || lower.includes('cloud')) {
    return 'lan';
  }
  if (lower.includes('math') || lower.includes('discrete') || lower.includes('algo')) {
    return 'calculator-variant';
  }
  return 'book-open-variant';
}

function findMatchingCourse(slotSubject: string, courses: Course[]): Course | undefined {
  const normSlot = slotSubject.toLowerCase().trim();

  // 1. Exact match
  let match = courses.find((c) => c.name.toLowerCase().trim() === normSlot);
  if (match) return match;

  // 2. Acronym match: e.g. "ML" matches "Machine Learning (ML)"
  match = courses.find((c) => {
    const acronymMatch = c.name.match(/\(([^)]+)\)/);
    if (acronymMatch && acronymMatch[1].toLowerCase().trim() === normSlot) {
      return true;
    }
    return false;
  });
  if (match) return match;

  // 3. Composite or partial match: e.g. "ML Lab" in "ML Lab (G1) / Minor (G2)"
  match = courses.find((c) => {
    const cNorm = c.name.toLowerCase().trim();
    return normSlot.includes(cNorm) || cNorm.includes(normSlot);
  });
  if (match) return match;

  // 4. Token match: check if acronym appears in slot tokens
  match = courses.find((c) => {
    const tokens = normSlot.split(/[\s/()]+/);
    const acronymMatch = c.name.match(/\(([^)]+)\)/);
    const acr = acronymMatch ? acronymMatch[1].toLowerCase().trim() : '';
    return acr ? tokens.includes(acr) : false;
  });
  if (match) return match;

  return undefined;
}

export default function AttendanceTrackerApp() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [timetable, setTimetable] = useState<Record<string, TimetableSlot[]>>(INITIAL_TIMETABLE);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const [fullScreenImageVisible, setFullScreenImageVisible] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'photo' | 'slots'>('photo');
  const [targetGoal, setTargetGoal] = useState<number>(65);
  const [activeTab, setActiveTab] = useState<'Classes' | 'Schedule' | 'Impact' | 'Target Planner' | 'Manage'>('Classes');
  const [impactMode, setImpactMode] = useState<'single' | 'multi'>('single');
  const [multiDaysInput, setMultiDaysInput] = useState<number>(6);
  const [analysisDay, setAnalysisDay] = useState<string>(() => {
    const dayIndex = new Date().getDay();
    const days = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex] || 'Mon';
  });
  const [simulatedSlotStatus, setSimulatedSlotStatus] = useState<Record<string, 'attend' | 'bunk'>>({});
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
        const [savedCourses, savedTimetable, savedProfile, savedProfilePic, savedGoal, savedTimetableImg] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.COURSES),
          AsyncStorage.getItem(STORAGE_KEYS.TIMETABLE),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_DATA),
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE_PIC),
          AsyncStorage.getItem(STORAGE_KEYS.GOAL),
          AsyncStorage.getItem(STORAGE_KEYS.TIMETABLE_IMG),
        ]);

        if (savedCourses) setCourses(JSON.parse(savedCourses));
        if (savedTimetable) setTimetable(JSON.parse(savedTimetable));
        if (savedProfile) setProfile(JSON.parse(savedProfile));
        if (savedProfilePic) setProfileImage(savedProfilePic);
        if (savedGoal) setTargetGoal(Number(savedGoal));
        if (savedTimetableImg) setTimetableImage(savedTimetableImg);
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

  // Timetable Picture Picker
  const pickTimetableImage = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      Alert.alert('Permission Denied', 'Gallery access is needed to select a timetable picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.95,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setTimetableImage(uri);
      await AsyncStorage.setItem(STORAGE_KEYS.TIMETABLE_IMG, uri);
    }
  };

  // Timetable Picture Removal / Reset
  const handleRemoveTimetableImage = () => {
    Alert.alert(
      'Timetable Picture Options',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Official Timetable',
          onPress: async () => {
            setTimetableImage(null);
            await AsyncStorage.removeItem(STORAGE_KEYS.TIMETABLE_IMG);
          },
        },
        {
          text: 'Remove Picture',
          style: 'destructive',
          onPress: async () => {
            setTimetableImage('removed');
            await AsyncStorage.setItem(STORAGE_KEYS.TIMETABLE_IMG, 'removed');
          },
        },
      ]
    );
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

  // Dynamic Mathematical Calculations - Accurate 2-decimal rounded precision
  const stats = useMemo(() => {
    const totalConducted = courses.reduce((acc, c) => acc + Number(c.total || 0), 0);
    const totalPresent = courses.reduce((acc, c) => acc + Number(c.present || 0), 0);
    const totalAbsent = Math.max(0, totalConducted - totalPresent);

    // Present Percentage (Total Present / Total Conducted)
    const presentPct = totalConducted === 0 ? 0 : round2((totalPresent / totalConducted) * 100);

    // Average Percentage Across All Subjects with at least 1 class
    const coursesWithClasses = courses.filter((c) => c.total > 0);
    const avgPct =
      coursesWithClasses.length === 0
        ? 0
        : round2(
            coursesWithClasses.reduce((acc, c) => acc + round2((c.present / c.total) * 100), 0) /
              coursesWithClasses.length
          );

    return {
      totalConducted,
      totalPresent,
      totalAbsent,
      presentPct,
      avgPct,
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

  // Target Attendance Math (Bunk or Attend more) - Exact Integer Arithmetic with 2-digit boundary verification
  const calculateGoalAdvice = (present: number, total: number, target: number) => {
    if (total === 0 || target <= 0) return { status: 'none', count: 0 };
    const currentPct = round2((present / total) * 100);

    if (currentPct >= target) {
      let canBunk = Math.floor((100 * present - target * total) / target);
      if (canBunk < 0) canBunk = 0;
      while (canBunk > 0 && round2((present / (total + canBunk)) * 100) < target) {
        canBunk--;
      }
      return { status: 'safe', count: Math.max(0, canBunk) };
    } else {
      if (target >= 100) return { status: 'short', count: 999 };
      const diff = target * total - 100 * present;
      const divisor = 100 - target;
      let needToAttend = Math.max(1, Math.ceil(diff / divisor));
      while (
        needToAttend > 1 &&
        round2(((present + (needToAttend - 1)) / (total + (needToAttend - 1))) * 100) >= target
      ) {
        needToAttend--;
      }
      return { status: 'short', count: needToAttend };
    }
  };

  // Day-by-Day Timetable Attendance Impact Analysis
  const daySlots = timetable[analysisDay] || [];

  const dayAnalysis = useMemo(() => {
    const classCount = daySlots.length;
    const currentTotal = stats.totalConducted;
    const currentPresent = stats.totalPresent;
    const currentPct = round2(stats.presentPct);

    if (classCount === 0) {
      return {
        classCount: 0,
        currentPct,
        attendAll: { newPct: currentPct, delta: 0, newPresent: currentPresent, newTotal: currentTotal },
        bunkAll: { newPct: currentPct, delta: 0, newPresent: currentPresent, newTotal: currentTotal },
        customSim: {
          newPct: currentPct,
          delta: 0,
          newPresent: currentPresent,
          newTotal: currentTotal,
          attendCount: 0,
          bunkCount: 0,
        },
        slotBreakdown: [],
      };
    }

    // Scenario 1: Attend All classes on this day
    const attendNewTotal = currentTotal + classCount;
    const attendNewPresent = currentPresent + classCount;
    const attendNewPct = attendNewTotal === 0 ? 0 : round2((attendNewPresent / attendNewTotal) * 100);
    const attendDelta = round2(attendNewPct - currentPct);

    // Scenario 2: Bunk / Miss All classes on this day
    const bunkNewTotal = currentTotal + classCount;
    const bunkNewPresent = currentPresent;
    const bunkNewPct = bunkNewTotal === 0 ? 0 : round2((bunkNewPresent / bunkNewTotal) * 100);
    const bunkDelta = round2(bunkNewPct - currentPct);

    // Scenario 3: Custom Interactive Simulation
    let customAttendCount = 0;
    let customBunkCount = 0;
    daySlots.forEach((slot) => {
      const status = simulatedSlotStatus[slot.id] ?? 'attend';
      if (status === 'attend') {
        customAttendCount++;
      } else {
        customBunkCount++;
      }
    });

    const customNewTotal = currentTotal + classCount;
    const customNewPresent = currentPresent + customAttendCount;
    const customNewPct = customNewTotal === 0 ? 0 : round2((customNewPresent / customNewTotal) * 100);
    const customDelta = round2(customNewPct - currentPct);

    // Slot-by-slot subject breakdown
    const slotBreakdown = daySlots.map((slot) => {
      const matched = findMatchingCourse(slot.subject, courses);
      const isAttended = (simulatedSlotStatus[slot.id] ?? 'attend') === 'attend';

      if (!matched) {
        return {
          slot,
          matchedCourse: null,
          isAttended,
          currentSubPct: 0,
          attendSubPct: 0,
          attendSubDelta: 0,
          bunkSubPct: 0,
          bunkSubDelta: 0,
        };
      }

      const cPresent = matched.present;
      const cTotal = matched.total;
      const currentSubPct = cTotal === 0 ? 0 : round2((cPresent / cTotal) * 100);

      const attendSubPct = round2(((cPresent + 1) / (cTotal + 1)) * 100);
      const attendSubDelta = round2(attendSubPct - currentSubPct);

      const bunkSubPct = round2((cPresent / (cTotal + 1)) * 100);
      const bunkSubDelta = round2(bunkSubPct - currentSubPct);

      return {
        slot,
        matchedCourse: matched,
        isAttended,
        currentSubPct,
        attendSubPct,
        attendSubDelta,
        bunkSubPct,
        bunkSubDelta,
      };
    });

    return {
      classCount,
      currentPct,
      attendAll: {
        newPct: attendNewPct,
        delta: attendDelta,
        newPresent: attendNewPresent,
        newTotal: attendNewTotal,
      },
      bunkAll: {
        newPct: bunkNewPct,
        delta: bunkDelta,
        newPresent: bunkNewPresent,
        newTotal: bunkNewTotal,
      },
      customSim: {
        newPct: customNewPct,
        delta: customDelta,
        newPresent: customNewPresent,
        newTotal: customNewTotal,
        attendCount: customAttendCount,
        bunkCount: customBunkCount,
      },
      slotBreakdown,
    };
  }, [daySlots, stats, courses, simulatedSlotStatus]);

  // Multi-Day Timetable Attendance Impact Analysis (e.g. Next N Days sequence)
  const DAYS_ORDER: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  const multiDayAnalysis = useMemo(() => {
    const daysCount = Math.max(1, Math.min(30, multiDaysInput || 1));
    const startIdx = DAYS_ORDER.indexOf(analysisDay as any) >= 0 ? DAYS_ORDER.indexOf(analysisDay as any) : 0;

    let totalScheduledClasses = 0;
    const daysSequence: { day: string; count: number; subjects: string[] }[] = [];

    for (let i = 0; i < daysCount; i++) {
      const dayName = DAYS_ORDER[(startIdx + i) % DAYS_ORDER.length];
      const slots = timetable[dayName] || [];
      totalScheduledClasses += slots.length;
      daysSequence.push({
        day: dayName,
        count: slots.length,
        subjects: slots.map((s) => s.subject),
      });
    }

    const currentTotal = stats.totalConducted;
    const currentPresent = stats.totalPresent;
    const currentPct = round2(stats.presentPct);

    // If Attend All
    const attendTotal = currentTotal + totalScheduledClasses;
    const attendPresent = currentPresent + totalScheduledClasses;
    const attendNewPct = attendTotal === 0 ? 0 : round2((attendPresent / attendTotal) * 100);
    const attendDelta = round2(attendNewPct - currentPct);

    // If Bunk / Absent All
    const bunkTotal = currentTotal + totalScheduledClasses;
    const bunkPresent = currentPresent;
    const bunkNewPct = bunkTotal === 0 ? 0 : round2((bunkPresent / bunkTotal) * 100);
    const bunkDelta = round2(bunkNewPct - currentPct);

    return {
      daysCount,
      totalScheduledClasses,
      daysSequence,
      currentPct,
      attendAll: {
        newPct: attendNewPct,
        delta: attendDelta,
        newPresent: attendPresent,
        newTotal: attendTotal,
      },
      bunkAll: {
        newPct: bunkNewPct,
        delta: bunkDelta,
        newPresent: bunkPresent,
        newTotal: bunkTotal,
      },
    };
  }, [multiDaysInput, analysisDay, timetable, stats]);

  const toggleSlotSimulation = (slotId: string) => {
    setSimulatedSlotStatus((prev) => {
      const current = prev[slotId] ?? 'attend';
      return {
        ...prev,
        [slotId]: current === 'attend' ? 'bunk' : 'attend',
      };
    });
  };

  const setAllSlotsSimulation = (status: 'attend' | 'bunk') => {
    const updated: Record<string, 'attend' | 'bunk'> = {};
    daySlots.forEach((s) => {
      updated[s.id] = status;
    });
    setSimulatedSlotStatus((prev) => ({ ...prev, ...updated }));
  };

  const handleApplyDayAttendance = () => {
    if (daySlots.length === 0) {
      Alert.alert('No Lectures', `No lectures are scheduled on ${analysisDay}.`);
      return;
    }

    const { attendCount, bunkCount } = dayAnalysis.customSim;

    Alert.alert(
      `Apply ${analysisDay} Attendance`,
      `Record ${attendCount} attended and ${bunkCount} missed class(es) into your tracker subjects?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply to Tracker',
          onPress: () => {
            setCourses((prev) =>
              prev.map((c) => {
                let addPresent = 0;
                let addTotal = 0;
                daySlots.forEach((slot) => {
                  const matched = findMatchingCourse(slot.subject, prev);
                  if (matched && matched.id === c.id) {
                    addTotal += 1;
                    if ((simulatedSlotStatus[slot.id] ?? 'attend') === 'attend') {
                      addPresent += 1;
                    }
                  }
                });
                if (addTotal > 0) {
                  return {
                    ...c,
                    present: c.present + addPresent,
                    total: c.total + addTotal,
                  };
                }
                return c;
              })
            );
            Alert.alert(
              'Attendance Applied!',
              `Recorded ${analysisDay} attendance (${attendCount} Present, ${bunkCount} Absent).`
            );
          },
        },
      ]
    );
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
        <ActivityIndicator size="large" color="#18A77A" />
      </SafeAreaView>
    );
  }

  const overallAdvice = calculateGoalAdvice(stats.totalPresent, stats.totalConducted, targetGoal);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TOP HERO HEADER */}
        <View style={styles.headerHero}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#1E3A8A" />
                <Stop offset="40%" stopColor="#2563EB" />
                <Stop offset="80%" stopColor="#0284C7" />
                <Stop offset="100%" stopColor="#06B6D4" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#heroGradient)" />
            <Path
              d="M-20,130 Q100,80 220,120 T460,95 L460,220 L-20,220 Z"
              fill="rgba(255, 255, 255, 0.08)"
            />
            <Path
              d="M-20,150 Q120,105 260,140 T460,115 L460,220 L-20,220 Z"
              fill="rgba(255, 255, 255, 0.06)"
            />
          </Svg>

          <View style={styles.headerTopRow}>
            {/* Avatar & Student Name */}
            <View style={styles.headerProfileBtn}>
              <TouchableOpacity onPress={pickProfileImage} style={styles.avatarWrap} activeOpacity={0.85}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {profile.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIconDot}>
                  <Feather name="camera" size={9} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={openProfileEdit} activeOpacity={0.8}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.headerName}>{profile.name}</Text>
                  <Feather name="edit-2" size={13} color="#FFFFFF" />
                </View>
                <Text style={styles.headerSemester}>{profile.semester}</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons: Bell & Calendar */}
            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Attendance Notifications',
                    `${profile.name}, your overall attendance is ${stats.presentPct.toFixed(2)}%. Target is ${targetGoal}%. Keep attending lectures!`,
                    [{ text: 'OK' }]
                  );
                }}
                style={styles.headerGlassBtn}
                activeOpacity={0.8}
              >
                <Feather name="bell" size={18} color="#FFFFFF" />
                <View style={styles.bellBadgeDot} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('Schedule')}
                style={styles.headerGlassBtn}
                activeOpacity={0.8}
              >
                <Feather name="calendar" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* OVERLAPPING COLLEGE / INSTITUTION CARD */}
        <View style={styles.profileBanner}>
          <View style={styles.profileBannerTop}>
            <View style={styles.verifiedTag}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#059669" />
              <Text style={styles.verifiedTagText}>OFFLINE SAVED</Text>
              <MaterialCommunityIcons name="wifi-off" size={12} color="#059669" style={{ marginLeft: 2 }} />
            </View>
            <TouchableOpacity onPress={openProfileEdit} style={styles.editBioBtn} activeOpacity={0.7}>
              <Feather name="edit-3" size={13} color="#2563EB" />
              <Text style={styles.editBioBtnText}>Edit Info</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.collegeBuildingRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.collegeText}>{profile.college}</Text>
              <Text style={styles.degreeText}>{profile.degree}</Text>
            </View>
            <CollegeBuildingGraphic />
          </View>

          {/* Shortage Alert / Safe Zone Banner */}
          <TouchableOpacity
            onPress={() => setActiveTab('Target Planner')}
            activeOpacity={0.85}
            style={[
              styles.targetStatusBox,
              {
                backgroundColor: overallAdvice.status === 'safe' ? '#ECFDF5' : '#FFF1F2',
                borderColor: overallAdvice.status === 'safe' ? '#A7F3D0' : '#FFE4E6',
              },
            ]}
          >
            <View
              style={[
                styles.alertIconCircle,
                { backgroundColor: overallAdvice.status === 'safe' ? '#10B981' : '#F43F5E' },
              ]}
            >
              {overallAdvice.status === 'safe' ? (
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              ) : (
                <Text style={styles.alertExclamationMark}>!</Text>
              )}
            </View>
            <Text style={styles.targetStatusBoxText}>
              {overallAdvice.status === 'safe' ? (
                <>
                  <Text style={{ fontWeight: '800', color: '#059669' }}>Safe Zone: </Text>
                  You can bunk next{' '}
                  <Text style={{ fontWeight: '800', color: '#059669' }}>{overallAdvice.count}</Text>{' '}
                  class(es) maintaining <Text style={{ fontWeight: '800' }}>{targetGoal}%</Text> target.
                </>
              ) : (
                <>
                  <Text style={{ fontWeight: '800', color: '#E11D48' }}>Shortage Alert: </Text>
                  Attend next{' '}
                  <Text style={{ fontWeight: '800', color: '#E11D48' }}>{overallAdvice.count}</Text>{' '}
                  lecture(s) continuously to reach{' '}
                  <Text style={{ fontWeight: '800' }}>{targetGoal}%</Text>.
                </>
              )}
            </Text>
            <Feather
              name="chevron-right"
              size={16}
              color={overallAdvice.status === 'safe' ? '#10B981' : '#F43F5E'}
            />
          </TouchableOpacity>
        </View>

        {/* 2x2 KPI METRICS GRID */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Present % */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="chart-box-outline" size={16} color="#10B981" />
              <Text style={styles.kpiLabel}>PRESENT %</Text>
            </View>
            <View style={styles.kpiBodyRow}>
              <View>
                <Text style={[styles.kpiValue, { color: '#059669' }]}>
                  {stats.presentPct.toFixed(2)}%
                </Text>
                <Text style={styles.kpiSubText}>Keep going!</Text>
              </View>
              <CircularProgress percentage={stats.presentPct} color="#10B981" size={50} strokeWidth={5} />
            </View>
          </View>

          {/* Card 2: Average % */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <MaterialCommunityIcons name="chart-line" size={16} color="#2563EB" />
              <Text style={styles.kpiLabel}>AVERAGE %</Text>
            </View>
            <View style={styles.kpiBodyRow}>
              <View>
                <Text style={[styles.kpiValue, { color: '#2563EB' }]}>
                  {stats.avgPct.toFixed(2)}%
                </Text>
                <Text style={styles.kpiSubText}>Overall average</Text>
              </View>
              <CircularProgress percentage={stats.avgPct} color="#2563EB" size={50} strokeWidth={5} />
            </View>
          </View>

          {/* Card 3: Attended */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Ionicons name="book-outline" size={15} color="#D97706" />
              <Text style={styles.kpiLabel}>ATTENDED</Text>
            </View>
            <View style={styles.kpiBodyRow}>
              <View>
                <Text style={[styles.kpiValue, { color: '#D97706' }]}>{stats.totalPresent}</Text>
                <Text style={styles.kpiSubText}>Total classes</Text>
              </View>
              <View style={styles.kpiAttendedIconWrap}>
                <View style={styles.kpiAttendedInnerBadge}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>

          {/* Card 4: Missed */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Ionicons name="calendar-outline" size={15} color="#DC2626" />
              <Text style={styles.kpiLabel}>MISSED</Text>
            </View>
            <View style={styles.kpiBodyRow}>
              <View>
                <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{stats.totalAbsent}</Text>
                <Text style={styles.kpiSubText}>Total classes</Text>
              </View>
              <View style={styles.kpiMissedIconWrap}>
                <View style={styles.kpiMissedInnerBadge}>
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* TARGET ATTENDANCE THRESHOLD CARD */}
        <View style={styles.targetAdjustCard}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="targetCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#2563EB" />
                <Stop offset="50%" stopColor="#4338CA" />
                <Stop offset="100%" stopColor="#6366F1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#targetCardGrad)" />
            <Circle cx="15%" cy="30%" r="90" fill="rgba(255,255,255,0.06)" />
            <Circle cx="85%" cy="85%" r="75" fill="rgba(255,255,255,0.05)" />
          </Svg>

          <View style={styles.targetAdjustHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <MaterialCommunityIcons name="target" size={32} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.targetAdjustTitle}>Target Attendance Threshold</Text>
                <Text style={styles.targetAdjustSub}>Tap or customize your institutional target:</Text>
              </View>
            </View>
            <View style={styles.targetValueBadge}>
              <MaterialCommunityIcons name="target" size={14} color="#D97706" />
              <Text style={styles.targetValueBadgeText}>{targetGoal}%</Text>
            </View>
          </View>

          <View style={styles.targetBtnRow}>
            {[65, 75, 80, 85, 90].map((goal) => {
              const isSelected = targetGoal === goal;
              return (
                <TouchableOpacity
                  key={goal}
                  onPress={() => setTargetGoal(goal)}
                  style={[styles.targetChoiceBtn, isSelected && styles.targetChoiceBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.targetChoiceText,
                      isSelected && styles.targetChoiceTextActive,
                    ]}
                  >
                    {goal}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FLOATING TAB NAVIGATION BAR */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('Classes')}
            style={[styles.tabButton, activeTab === 'Classes' && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'Classes' ? 'school' : 'school-outline'}
              size={17}
              color={activeTab === 'Classes' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'Classes' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Class
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Schedule')}
            style={[styles.tabButton, activeTab === 'Schedule' && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Feather
              name="calendar"
              size={16}
              color={activeTab === 'Schedule' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'Schedule' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Subject
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Impact')}
            style={[styles.tabButton, activeTab === 'Impact' && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'Impact' ? 'flash' : 'flash-outline'}
              size={17}
              color={activeTab === 'Impact' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'Impact' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Impact
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Target Planner')}
            style={[styles.tabButton, activeTab === 'Target Planner' && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="target"
              size={17}
              color={activeTab === 'Target Planner' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'Target Planner' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Planner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Manage')}
            style={[styles.tabButton, activeTab === 'Manage' && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Feather
              name="settings"
              size={16}
              color={activeTab === 'Manage' ? '#FFFFFF' : '#64748B'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'Manage' && styles.tabButtonTextActive]}
              numberOfLines={1}
            >
              Manage
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: CLASSES */}
        {activeTab === 'Classes' && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BookStackGraphic />
                <Text style={styles.sectionTitle}>Tracked Subjects ({courses.length})</Text>
              </View>
              <TouchableOpacity onPress={() => openCourseModal()} style={styles.primaryAddBtn} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.primaryAddBtnText}>Add Subject</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              {courses.map((course) => {
                const subPct = course.total === 0 ? 0 : (course.present / course.total) * 100;
                const isBelow = subPct < targetGoal && course.total > 0;

                return (
                  <View key={course.id} style={[styles.courseCard, { borderLeftColor: course.color }]}>
                    <View style={styles.courseCardTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={[styles.subjectOrb, { backgroundColor: `${course.color}18` }]}>
                          <MaterialCommunityIcons
                            name={getSubjectIcon(course.name)}
                            size={22}
                            color={course.color}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.courseName}>{course.name}</Text>
                          <View style={styles.courseTypeBadge}>
                            <MaterialCommunityIcons
                              name={course.type === 'Practical' ? 'flask-outline' : 'laptop'}
                              size={11}
                              color="#2563EB"
                            />
                            <Text style={styles.courseTypeBadgeText}>{course.type}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.courseStatsRight}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text
                            style={[
                              styles.coursePctText,
                              { color: isBelow ? '#EF4444' : '#059669' },
                            ]}
                          >
                            {subPct.toFixed(2)}%
                          </Text>
                          <Feather name="chevron-right" size={16} color="#94A3B8" />
                        </View>
                        <TouchableOpacity
                          onPress={() => openCourseModal(course)}
                          style={styles.cardEditIconBtn}
                          activeOpacity={0.7}
                        >
                          <Feather name="edit-2" size={13} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Stepper Controls */}
                    <View style={styles.stepperContainer}>
                      <View style={styles.stepperBox}>
                        <Text style={styles.stepperLabel}>Present</Text>
                        <View style={styles.stepperActionGroup}>
                          <TouchableOpacity
                            onPress={() => updateCount(course.id, 'present', -1)}
                            style={styles.stepBtnMinus}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={14} color="#64748B" />
                          </TouchableOpacity>
                          <Text style={styles.stepNumberText}>{course.present}</Text>
                          <TouchableOpacity
                            onPress={() => updateCount(course.id, 'present', 1)}
                            style={styles.stepBtnPlusPresent}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={16} color="#059669" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.stepperBox}>
                        <Text style={styles.stepperLabel}>Total Held</Text>
                        <View style={styles.stepperActionGroup}>
                          <TouchableOpacity
                            onPress={() => updateCount(course.id, 'total', -1)}
                            style={styles.stepBtnMinus}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={14} color="#64748B" />
                          </TouchableOpacity>
                          <Text style={styles.stepNumberText}>{course.total}</Text>
                          <TouchableOpacity
                            onPress={() => updateCount(course.id, 'total', 1)}
                            style={styles.stepBtnPlusTotal}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={16} color="#2563EB" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'Schedule' && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="calendar-clock" size={19} color="#D68B16" />
                <Text style={styles.sectionTitle}>College Timetable</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={pickTimetableImage}
                  style={styles.primaryAddBtn}
                >
                  <Feather name="upload" size={14} color="#F4F7FB" />
                  <Text style={styles.primaryAddBtnText}>Update Picture</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRemoveTimetableImage}
                  style={[styles.primaryAddBtn, { backgroundColor: '#EEF3F8', borderWidth: 1, borderColor: '#E2E8F0' }]}
                >
                  <Ionicons name="trash-outline" size={14} color="#E45C70" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Toggle between Photo and Slots view */}
            <View style={styles.viewModeToggleRow}>
              <TouchableOpacity
                onPress={() => setScheduleViewMode('photo')}
                style={[styles.viewModeToggleBtn, scheduleViewMode === 'photo' && styles.viewModeToggleBtnActive]}
              >
                <Feather name="image" size={13} color={scheduleViewMode === 'photo' ? '#18A77A' : '#64748B'} />
                <Text style={[styles.viewModeToggleText, scheduleViewMode === 'photo' && styles.viewModeToggleTextActive]}>
                  Timetable Picture
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setScheduleViewMode('slots')}
                style={[styles.viewModeToggleBtn, scheduleViewMode === 'slots' && styles.viewModeToggleBtnActive]}
              >
                <Feather name="list" size={13} color={scheduleViewMode === 'slots' ? '#18A77A' : '#64748B'} />
                <Text style={[styles.viewModeToggleText, scheduleViewMode === 'slots' && styles.viewModeToggleTextActive]}>
                  Class Periods List
                </Text>
              </TouchableOpacity>
            </View>

            {/* PHOTO VIEW */}
            {scheduleViewMode === 'photo' && (
              timetableImage === 'removed' ? (
                <View style={styles.emptyCard}>
                  <Feather name="image" size={38} color="#748197" />
                  <Text style={styles.emptyCardTitle}>No timetable picture uploaded</Text>
                  <Text style={styles.emptyCardSub}>
                    Upload your semester timetable photo or restore the official department schedule.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <TouchableOpacity onPress={pickTimetableImage} style={styles.primaryAddBtn}>
                      <Ionicons name="add" size={16} color="#F4F7FB" />
                      <Text style={styles.primaryAddBtnText}>Upload Picture</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setTimetableImage(null);
                        AsyncStorage.removeItem(STORAGE_KEYS.TIMETABLE_IMG);
                      }}
                      style={[styles.primaryAddBtn, { backgroundColor: '#3778D5' }]}
                    >
                      <Ionicons name="refresh" size={16} color="#F4F7FB" />
                      <Text style={styles.primaryAddBtnText}>Restore Official</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.timetableImageCard}>
                  <View style={styles.timetableBadgeRow}>
                    <View style={styles.verifiedTag}>
                      <MaterialCommunityIcons name="check-decagram" size={13} color="#18A77A" />
                      <Text style={styles.verifiedTagText}>
                        {timetableImage ? 'CUSTOM TIMETABLE' : 'OIST CSE-DS (V-C)'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setFullScreenImageVisible(true)}
                      style={styles.expandIconBtn}
                    >
                      <Feather name="maximize-2" size={13} color="#3778D5" />
                      <Text style={styles.expandIconBtnText}>Pinch & Zoom</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setFullScreenImageVisible(true)}
                    style={styles.timetableImageWrap}
                  >
                    <Image
                      source={timetableImage ? { uri: timetableImage } : DEFAULT_TIMETABLE_IMG}
                      style={styles.timetablePreviewImage}
                      resizeMode="contain"
                    />
                    <View style={styles.imageOverlayHint}>
                      <Feather name="zoom-in" size={14} color="#FFFFFF" />
                      <Text style={styles.imageOverlayHintText}>Tap for Fullscreen</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.timetableCardFooter}>
                    <TouchableOpacity
                      onPress={pickTimetableImage}
                      style={styles.timetableFooterBtn}
                    >
                      <Feather name="image" size={14} color="#3778D5" />
                      <Text style={styles.timetableFooterBtnText}>Replace Photo</Text>
                    </TouchableOpacity>
                    <View style={styles.footerDivider} />
                    <TouchableOpacity
                      onPress={() => setFullScreenImageVisible(true)}
                      style={styles.timetableFooterBtn}
                    >
                      <Feather name="eye" size={14} color="#18A77A" />
                      <Text style={[styles.timetableFooterBtnText, { color: '#18A77A' }]}>
                        Open Full View
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.footerDivider} />
                    <TouchableOpacity
                      onPress={handleRemoveTimetableImage}
                      style={styles.timetableFooterBtn}
                    >
                      <Ionicons name="trash-outline" size={14} color="#E45C70" />
                      <Text style={[styles.timetableFooterBtnText, { color: '#E45C70' }]}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}

            {/* SLOTS LIST VIEW */}
            {scheduleViewMode === 'slots' && (
              <View style={{ gap: 14 }}>
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
                    <Feather name="coffee" size={32} color="#748197" />
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
                          <Ionicons name="time-outline" size={13} color="#18A77A" />
                          <Text style={styles.slotTimeText}>{slot.time}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity onPress={() => openSlotModal(slot)} style={styles.slotActionBtn}>
                            <Feather name="edit-2" size={13} color="#3778D5" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteSlot(selectedDay, slot.id)}
                            style={styles.slotActionBtn}
                          >
                            <Ionicons name="trash-outline" size={14} color="#E45C70" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={styles.slotSubjectTitle}>{slot.subject}</Text>

                      <View style={styles.slotFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <MaterialCommunityIcons name="door-open" size={13} color="#64748B" />
                          <Text style={styles.slotRoomText}>{slot.room || 'Main Classroom'}</Text>
                        </View>
                        <View style={styles.slotTypeBadge}>
                          <Text style={styles.slotTypeBadgeText}>{slot.type}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setAnalysisDay(selectedDay);
                      setImpactMode('single');
                      setActiveTab('Impact');
                    }}
                    style={styles.scheduleAnalyzeBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calculator-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.scheduleAnalyzeBtnText}>
                      Analyze {selectedDay} Impact
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openSlotModal()}
                    style={styles.scheduleAddPeriodBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={15} color="#059669" />
                    <Text style={styles.scheduleAddPeriodBtnText}>Add Period</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: IMPACT ANALYZER (SEPARATE TAB) */}
        {activeTab === 'Impact' && (
          <View style={styles.tabContentWrapper}>
            <View style={styles.analyzerContainer}>
              <View style={styles.analyzerHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <View style={styles.analyzerIconOrb}>
                    <Ionicons name="flash" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.analyzerMainTitle}>Timetable Impact Analyzer</Text>
                    <Text style={styles.analyzerSubtitle}>
                      Analyze attendance gain if attended or loss if bunked
                    </Text>
                  </View>
                </View>
              </View>

              {/* Mode Switcher: Single Day vs Multi-Day */}
              <View style={styles.impactModeToggleRow}>
                <TouchableOpacity
                  onPress={() => setImpactMode('single')}
                  style={[styles.impactModeBtn, impactMode === 'single' && styles.impactModeBtnActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={impactMode === 'single' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.impactModeBtnText,
                      impactMode === 'single' && styles.impactModeBtnTextActive,
                    ]}
                  >
                    Single Day
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setImpactMode('multi')}
                  style={[styles.impactModeBtn, impactMode === 'multi' && styles.impactModeBtnActive]}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="trending-up"
                    size={14}
                    color={impactMode === 'multi' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.impactModeBtnText,
                      impactMode === 'multi' && styles.impactModeBtnTextActive,
                    ]}
                  >
                    Multi-Day (e.g. 6 Days)
                  </Text>
                </TouchableOpacity>
              </View>

              {impactMode === 'single' ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: '#64748B', fontSize: 11.5, fontWeight: '600' }}>
                      Select day to calculate gain/loss:
                    </Text>
                    <View style={styles.analyzerDayBadge}>
                      <Text style={styles.analyzerDayBadgeText}>
                        {analysisDay} • {dayAnalysis.classCount} Classes
                      </Text>
                    </View>
                  </View>

              {/* Clickable Day Selector Pills */}
              <View style={styles.analyzerDayRow}>
                {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day) => {
                  const isDayActive = analysisDay === day;
                  const count = (timetable[day] || []).length;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setAnalysisDay(day)}
                      style={[styles.analyzerDayBtn, isDayActive && styles.analyzerDayBtnActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.analyzerDayBtnText, isDayActive && styles.analyzerDayBtnTextActive]}>
                        {day}
                      </Text>
                      <View
                        style={[
                          styles.analyzerDayCountBadge,
                          isDayActive && styles.analyzerDayCountBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.analyzerDayCountText,
                            isDayActive && styles.analyzerDayCountTextActive,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ANALYSIS FOR SELECTED DAY */}
              {dayAnalysis.classCount === 0 ? (
                <View style={styles.analyzerEmptyCard}>
                  <Feather name="coffee" size={30} color="#94A3B8" />
                  <Text style={styles.analyzerEmptyTitle}>No classes scheduled on {analysisDay}</Text>
                  <Text style={styles.analyzerEmptySub}>
                    Your attendance percentage will remain unaffected on this day.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {/* 2 Big Impact Comparison Cards: Attend All vs Bunk All */}
                  <View style={styles.impactComparisonRow}>
                    {/* CARD A: IF YOU ATTEND ALL */}
                    <View style={styles.impactCardAttend}>
                      <View style={styles.impactCardHeader}>
                        <View style={styles.impactBadgeGreen}>
                          <Ionicons name="trending-up" size={13} color="#059669" />
                          <Text style={styles.impactBadgeGreenText}>IF ATTENDED</Text>
                        </View>
                        <Text style={styles.impactSubCount}>+{dayAnalysis.classCount} classes</Text>
                      </View>
                      <Text style={styles.impactDeltaGreen}>
                        +{dayAnalysis.attendAll.delta.toFixed(2)}%
                      </Text>
                      <Text style={styles.impactProjectedText}>
                        New Overall:{' '}
                        <Text style={{ fontWeight: '800', color: '#059669' }}>
                          {dayAnalysis.attendAll.newPct.toFixed(2)}%
                        </Text>
                      </Text>
                      <Text style={styles.impactStatusGreen}>
                        {dayAnalysis.attendAll.newPct >= targetGoal
                          ? 'Above target goal'
                          : `Needs ${(targetGoal - dayAnalysis.attendAll.newPct).toFixed(2)}% more`}
                      </Text>
                    </View>

                    {/* CARD B: IF YOU BUNK ALL */}
                    <View style={styles.impactCardBunk}>
                      <View style={styles.impactCardHeader}>
                        <View style={styles.impactBadgeRed}>
                          <Ionicons name="trending-down" size={13} color="#DC2626" />
                          <Text style={styles.impactBadgeRedText}>IF BUNKED</Text>
                        </View>
                        <Text style={styles.impactSubCount}>-{dayAnalysis.classCount} classes</Text>
                      </View>
                      <Text style={styles.impactDeltaRed}>
                        {dayAnalysis.bunkAll.delta.toFixed(2)}%
                      </Text>
                      <Text style={styles.impactProjectedText}>
                        New Overall:{' '}
                        <Text style={{ fontWeight: '800', color: '#DC2626' }}>
                          {dayAnalysis.bunkAll.newPct.toFixed(2)}%
                        </Text>
                      </Text>
                      <Text style={styles.impactStatusRed}>
                        {dayAnalysis.bunkAll.newPct < targetGoal
                          ? `Drops ${(targetGoal - dayAnalysis.bunkAll.newPct).toFixed(2)}% below target!`
                          : 'Stays safe above target'}
                      </Text>
                    </View>
                  </View>

                  {/* Safety Verdict Alert Banner */}
                  <View
                    style={[
                      styles.verdictBanner,
                      {
                        backgroundColor:
                          dayAnalysis.bunkAll.newPct >= targetGoal ? '#ECFDF5' : '#FFF1F2',
                        borderColor:
                          dayAnalysis.bunkAll.newPct >= targetGoal ? '#A7F3D0' : '#FECDD3',
                      },
                    ]}
                  >
                    <Ionicons
                      name={dayAnalysis.bunkAll.newPct >= targetGoal ? 'shield-checkmark' : 'alert-circle'}
                      size={18}
                      color={dayAnalysis.bunkAll.newPct >= targetGoal ? '#059669' : '#E11D48'}
                    />
                    <Text style={styles.verdictBannerText}>
                      {dayAnalysis.bunkAll.newPct >= targetGoal ? (
                        <>
                          <Text style={{ fontWeight: '800', color: '#059669' }}>
                            Safe to Bunk {analysisDay}? YES.{' '}
                          </Text>
                          Even if you bunk all {dayAnalysis.classCount} classes, overall attendance will remain at{' '}
                          <Text style={{ fontWeight: '800' }}>{dayAnalysis.bunkAll.newPct.toFixed(2)}%</Text>{' '}
                          (above {targetGoal}% target).
                        </>
                      ) : (
                        <>
                          <Text style={{ fontWeight: '800', color: '#E11D48' }}>
                            Safe to Bunk {analysisDay}? NO.{' '}
                          </Text>
                          Bunking all {dayAnalysis.classCount} classes drops your attendance to{' '}
                          <Text style={{ fontWeight: '800' }}>{dayAnalysis.bunkAll.newPct.toFixed(2)}%</Text>, falling{' '}
                          <Text style={{ fontWeight: '800' }}>
                            {(targetGoal - dayAnalysis.bunkAll.newPct).toFixed(2)}%
                          </Text>{' '}
                          below your institutional target!
                        </>
                      )}
                    </Text>
                  </View>

                  {/* Interactive Lecture-by-Lecture Breakdown & Simulation */}
                  <View style={styles.simCardContainer}>
                    <View style={styles.simCardHeader}>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={styles.simCardTitle}>Individual Period Impact Breakdown</Text>
                        <Text style={styles.simCardSub}>
                          Tap each lecture to simulate attending vs bunking:
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => setAllSlotsSimulation('attend')}
                          style={styles.simPresetBtnAttend}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.simPresetBtnAttendText}>Attend All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setAllSlotsSimulation('bunk')}
                          style={styles.simPresetBtnBunk}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.simPresetBtnBunkText}>Bunk All</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Live Simulation Projection Bar */}
                    <View style={styles.simLiveBar}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="analytics" size={15} color="#2563EB" />
                        <Text style={styles.simLiveBarText}>
                          Simulated: {dayAnalysis.customSim.attendCount}/{dayAnalysis.classCount} Attended
                        </Text>
                      </View>
                      <Text style={styles.simLiveBarPct}>
                        Overall: {dayAnalysis.customSim.newPct.toFixed(2)}% (
                        {dayAnalysis.customSim.delta >= 0 ? '+' : ''}
                        {dayAnalysis.customSim.delta.toFixed(2)}%)
                      </Text>
                    </View>

                    {/* Class Slots List */}
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {dayAnalysis.slotBreakdown.map((item, idx) => {
                        const isAttending = item.isAttended;
                        return (
                          <View key={item.slot.id || idx} style={styles.simSlotRow}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={styles.simSlotTimeBadge}>
                                  <Ionicons name="time-outline" size={11} color="#64748B" />
                                  <Text style={styles.simSlotTimeText}>{item.slot.time}</Text>
                                </View>
                                <View style={styles.simSlotTypeBadge}>
                                  <Text style={styles.simSlotTypeBadgeText}>{item.slot.type}</Text>
                                </View>
                              </View>

                              <Text style={styles.simSlotSubject}>{item.slot.subject}</Text>

                              {item.matchedCourse ? (
                                <View style={styles.simImpactRow}>
                                  <Text style={styles.simImpactCurr}>
                                    Curr: {item.currentSubPct.toFixed(2)}%
                                  </Text>
                                  <Text style={styles.simImpactSep}>•</Text>
                                  <Text
                                    style={[
                                      styles.simImpactDelta,
                                      { color: isAttending ? '#059669' : '#DC2626' },
                                    ]}
                                  >
                                    {isAttending
                                      ? `Attend: ${item.attendSubPct.toFixed(2)}% (+${item.attendSubDelta.toFixed(2)}%)`
                                      : `Bunk: ${item.bunkSubPct.toFixed(2)}% (${item.bunkSubDelta.toFixed(2)}%)`}
                                  </Text>
                                </View>
                              ) : (
                                <Text style={styles.simUnmatchedText}>
                                  {item.slot.room || 'General lecture'}
                                </Text>
                              )}
                            </View>

                            {/* Toggle Button */}
                            <TouchableOpacity
                              onPress={() => toggleSlotSimulation(item.slot.id)}
                              style={[
                                styles.simToggleBtn,
                                isAttending ? styles.simToggleBtnAttend : styles.simToggleBtnBunk,
                              ]}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={isAttending ? 'checkmark-circle' : 'close-circle'}
                                size={14}
                                color={isAttending ? '#059669' : '#DC2626'}
                              />
                              <Text
                                style={[
                                  styles.simToggleBtnText,
                                  isAttending
                                    ? styles.simToggleBtnTextAttend
                                    : styles.simToggleBtnTextBunk,
                                ]}
                              >
                                {isAttending ? 'Attend' : 'Bunk'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>

                    {/* Action Button: Apply to Tracker */}
                    <TouchableOpacity
                      onPress={handleApplyDayAttendance}
                      style={styles.simApplyBtn}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkbox-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.simApplyBtnText}>
                        Apply {analysisDay} Plan to Tracker
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
                </>
              ) : (
                /* MULTI-DAY CONSECUTIVE PROJECTION */
                <View style={{ gap: 12 }}>
                  <Text style={{ color: '#475569', fontSize: 12, lineHeight: 17 }}>
                    Calculate cumulative attendance impact for upcoming timetable days starting from {analysisDay}:
                  </Text>

                  {/* Preset Day Chips */}
                  <View style={styles.multiPresetRow}>
                    {[1, 2, 3, 5, 6, 7].map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => setMultiDaysInput(num)}
                        style={[
                          styles.multiPresetBtn,
                          multiDaysInput === num && styles.multiPresetBtnActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.multiPresetBtnText,
                            multiDaysInput === num && styles.multiPresetBtnTextActive,
                          ]}
                        >
                          {num} {num === 1 ? 'Day' : 'Days'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Stepper Control */}
                  <View style={styles.multiStepperRow}>
                    <TouchableOpacity
                      onPress={() => setMultiDaysInput((prev) => Math.max(1, prev - 1))}
                      style={styles.multiStepBtn}
                      activeOpacity={0.7}
                    >
                      <Feather name="minus" size={16} color="#2563EB" />
                    </TouchableOpacity>

                    <View style={styles.multiStepValueBox}>
                      <Text style={styles.multiStepValueText}>{multiDaysInput} Days</Text>
                      <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '600' }}>
                        {multiDayAnalysis.totalScheduledClasses} Timetable Classes
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setMultiDaysInput((prev) => Math.min(30, prev + 1))}
                      style={styles.multiStepBtn}
                      activeOpacity={0.7}
                    >
                      <Feather name="plus" size={16} color="#2563EB" />
                    </TouchableOpacity>
                  </View>

                  {/* 2 Big Impact Comparison Cards: Multi-Day Attend All vs Bunk All */}
                  <View style={styles.impactComparisonRow}>
                    {/* CARD A: IF YOU ATTEND ALL */}
                    <View style={styles.impactCardAttend}>
                      <View style={styles.impactCardHeader}>
                        <View style={styles.impactBadgeGreen}>
                          <Ionicons name="trending-up" size={13} color="#059669" />
                          <Text style={styles.impactBadgeGreenText}>ATTEND ALL {multiDaysInput}D</Text>
                        </View>
                        <Text style={styles.impactSubCount}>+{multiDayAnalysis.totalScheduledClasses} classes</Text>
                      </View>
                      <Text style={styles.impactDeltaGreen}>
                        +{multiDayAnalysis.attendAll.delta.toFixed(2)}%
                      </Text>
                      <Text style={styles.impactProjectedText}>
                        New Overall:{' '}
                        <Text style={{ fontWeight: '800', color: '#059669' }}>
                          {multiDayAnalysis.attendAll.newPct.toFixed(2)}%
                        </Text>
                      </Text>
                      <Text style={styles.impactStatusGreen}>
                        {multiDayAnalysis.attendAll.newPct >= targetGoal
                          ? 'Above target goal'
                          : `Needs ${(targetGoal - multiDayAnalysis.attendAll.newPct).toFixed(2)}% more`}
                      </Text>
                    </View>

                    {/* CARD B: IF YOU BUNK ALL */}
                    <View style={styles.impactCardBunk}>
                      <View style={styles.impactCardHeader}>
                        <View style={styles.impactBadgeRed}>
                          <Ionicons name="trending-down" size={13} color="#DC2626" />
                          <Text style={styles.impactBadgeRedText}>BUNK ALL {multiDaysInput}D</Text>
                        </View>
                        <Text style={styles.impactSubCount}>-{multiDayAnalysis.totalScheduledClasses} classes</Text>
                      </View>
                      <Text style={styles.impactDeltaRed}>
                        {multiDayAnalysis.bunkAll.delta.toFixed(2)}%
                      </Text>
                      <Text style={styles.impactProjectedText}>
                        New Overall:{' '}
                        <Text style={{ fontWeight: '800', color: '#DC2626' }}>
                          {multiDayAnalysis.bunkAll.newPct.toFixed(2)}%
                        </Text>
                      </Text>
                      <Text style={styles.impactStatusRed}>
                        {multiDayAnalysis.bunkAll.newPct < targetGoal
                          ? `Drops ${(targetGoal - multiDayAnalysis.bunkAll.newPct).toFixed(2)}% below target!`
                          : 'Stays safe above target'}
                      </Text>
                    </View>
                  </View>

                  {/* Safety Verdict Alert Banner */}
                  <View
                    style={[
                      styles.verdictBanner,
                      {
                        backgroundColor:
                          multiDayAnalysis.bunkAll.newPct >= targetGoal ? '#ECFDF5' : '#FFF1F2',
                        borderColor:
                          multiDayAnalysis.bunkAll.newPct >= targetGoal ? '#A7F3D0' : '#FECDD3',
                      },
                    ]}
                  >
                    <Ionicons
                      name={multiDayAnalysis.bunkAll.newPct >= targetGoal ? 'shield-checkmark' : 'alert-circle'}
                      size={18}
                      color={multiDayAnalysis.bunkAll.newPct >= targetGoal ? '#059669' : '#E11D48'}
                    />
                    <Text style={styles.verdictBannerText}>
                      {multiDayAnalysis.bunkAll.newPct >= targetGoal ? (
                        <>
                          <Text style={{ fontWeight: '800', color: '#059669' }}>
                            Safe to miss next {multiDaysInput} days? YES.{' '}
                          </Text>
                          Even if you miss all {multiDayAnalysis.totalScheduledClasses} classes over {multiDaysInput} days, your overall attendance will remain at{' '}
                          <Text style={{ fontWeight: '800' }}>{multiDayAnalysis.bunkAll.newPct.toFixed(2)}%</Text>{' '}
                          (above {targetGoal}% target).
                        </>
                      ) : (
                        <>
                          <Text style={{ fontWeight: '800', color: '#E11D48' }}>
                            Safe to miss next {multiDaysInput} days? NO.{' '}
                          </Text>
                          Missing all {multiDayAnalysis.totalScheduledClasses} classes drops your attendance to{' '}
                          <Text style={{ fontWeight: '800' }}>{multiDayAnalysis.bunkAll.newPct.toFixed(2)}%</Text>, falling{' '}
                          <Text style={{ fontWeight: '800' }}>
                            {(targetGoal - multiDayAnalysis.bunkAll.newPct).toFixed(2)}%
                          </Text>{' '}
                          below your {targetGoal}% institutional goal!
                        </>
                      )}
                    </Text>
                  </View>

                  {/* Day-by-Day Sequence Breakdown */}
                  <View style={styles.multiDaySeqContainer}>
                    <Text style={{ color: '#0F172A', fontSize: 12.5, fontWeight: '800', marginBottom: 4 }}>
                      Upcoming Schedule Breakdown ({multiDayAnalysis.daysSequence.length} Days)
                    </Text>
                    {multiDayAnalysis.daysSequence.map((item, idx) => (
                      <View key={idx} style={styles.multiDaySeqRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '700' }}>
                            Day {idx + 1}:
                          </Text>
                          <Text style={styles.multiDaySeqName}>{item.day}</Text>
                          <Text style={{ color: '#64748B', fontSize: 10.5, flex: 1 }} numberOfLines={1}>
                            {item.subjects.length > 0 ? item.subjects.slice(0, 3).join(', ') : 'No classes'}
                          </Text>
                        </View>
                        <Text style={styles.multiDaySeqCount}>{item.count} classes</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 4: TARGET PLANNER (SEPARATE TAB) */}
        {activeTab === 'Target Planner' && (
          <View style={styles.tabContentWrapper}>
            {/* INSTITUTIONAL TARGET GOAL PICKER */}
            <View style={styles.targetAdjustCard}>
              <View style={styles.targetAdjustHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flag-outline" size={16} color="#4338CA" />
                  <Text style={styles.targetAdjustTitle}>Institutional Attendance Target</Text>
                </View>
                <View style={styles.targetValueBadge}>
                  <Text style={styles.targetValueBadgeText}>{targetGoal}%</Text>
                </View>
              </View>

              <View style={styles.targetBtnRow}>
                {[65, 75, 80, 85, 90].map((goal) => {
                  const isSelected = targetGoal === goal;
                  return (
                    <TouchableOpacity
                      key={goal}
                      onPress={() => setTargetGoal(goal)}
                      style={[styles.targetChoiceBtn, isSelected && styles.targetChoiceBtnActive]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.targetChoiceText,
                          isSelected && styles.targetChoiceTextActive,
                        ]}
                      >
                        {goal}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECTION 2: SAFE BUNK & RECOVERY PER SUBJECT */}
            <View style={[styles.sectionHeaderRow, { marginTop: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="shield-airplane-outline" size={18} color="#3778D5" />
                <Text style={styles.sectionTitle}>Safe Bunk & Attendance Recovery per Subject</Text>
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
                        { color: pct >= targetGoal ? '#18A77A' : '#E45C70' },
                      ]}
                    >
                      {pct.toFixed(2)}%
                    </Text>
                  </View>

                  <View style={styles.plannerAdviceBox}>
                    <FontAwesome5
                      name={advice.status === 'safe' ? 'umbrella-beach' : 'running'}
                      size={13}
                      color={advice.status === 'safe' ? '#18A77A' : '#E45C70'}
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
          <View style={styles.tabContentWrapper}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="tune" size={18} color="#8359D1" />
                <Text style={styles.sectionTitle}>Curriculum & Subject Setup</Text>
              </View>
              <TouchableOpacity onPress={() => openCourseModal()} style={styles.primaryAddBtn}>
                <Ionicons name="add" size={16} color="#F4F7FB" />
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
                    <Feather name="edit-2" size={14} color="#3778D5" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCourse(course.id, course.name)}
                    style={[styles.manageActionBtn, { backgroundColor: 'rgba(228, 92, 112, 0.12)' }]}
                  >
                    <Ionicons name="trash-outline" size={14} color="#E45C70" />
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
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Student Name</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Samit"
              placeholderTextColor="#748197"
            />

            <Text style={styles.inputLabel}>College / Institute</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editCollege}
              onChangeText={setEditCollege}
              placeholder="e.g. Oriental Institute of Science & Technology"
              placeholderTextColor="#748197"
            />

            <Text style={styles.inputLabel}>Degree & Branch</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editDegree}
              onChangeText={setEditDegree}
              placeholder="e.g. B.Tech • Computer Science (Data Science)"
              placeholderTextColor="#748197"
            />

            <Text style={styles.inputLabel}>Semester</Text>
            <TextInput
              style={styles.modalTextInput}
              value={editSemester}
              onChangeText={setEditSemester}
              placeholder="e.g. Semester V-C"
              placeholderTextColor="#748197"
            />

            <TouchableOpacity onPress={handleSaveProfile} style={styles.modalSaveBtn}>
              <Ionicons name="save" size={18} color="#F4F7FB" />
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
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Subject Name</Text>
            <TextInput
              style={styles.modalTextInput}
              value={subNameInput}
              onChangeText={setSubNameInput}
              placeholder="e.g. Machine Learning"
              placeholderTextColor="#748197"
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
              <Ionicons name="save" size={18} color="#F4F7FB" />
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
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Time Interval</Text>
            <TextInput
              style={styles.modalTextInput}
              value={slotTimeInput}
              onChangeText={setSlotTimeInput}
              placeholder="e.g. 09:30 - 10:30 AM"
              placeholderTextColor="#748197"
            />

            <Text style={styles.inputLabel}>Subject Name</Text>
            <TextInput
              style={styles.modalTextInput}
              value={slotSubjectInput}
              onChangeText={setSlotSubjectInput}
              placeholder="e.g. Machine Learning"
              placeholderTextColor="#748197"
            />

            <Text style={styles.inputLabel}>Room / Lab Number</Text>
            <TextInput
              style={styles.modalTextInput}
              value={slotRoomInput}
              onChangeText={setSlotRoomInput}
              placeholder="e.g. Room 301 / Lab 2"
              placeholderTextColor="#748197"
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
              <Ionicons name="save" size={18} color="#F4F7FB" />
              <Text style={styles.modalSaveBtnText}>Save Period</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: FULLSCREEN TIMETABLE VIEWER */}
      <Modal visible={fullScreenImageVisible} animationType="fade" transparent={false}>
        <SafeAreaView style={styles.fullscreenModalArea}>
          <StatusBar barStyle="light-content" backgroundColor="#070A13" />
          <View style={styles.fullscreenHeader}>
            <View>
              <Text style={styles.fullscreenTitle}>Semester Timetable</Text>
              <Text style={styles.fullscreenSub}>{profile.college} • {profile.semester}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setFullScreenImageVisible(false)}
              style={styles.fullscreenCloseBtn}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            contentContainerStyle={styles.fullscreenImageContainer}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={timetableImage && timetableImage !== 'removed' ? { uri: timetableImage } : DEFAULT_TIMETABLE_IMG}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </ScrollView>

          <View style={styles.fullscreenBottomBar}>
            <TouchableOpacity
              onPress={pickTimetableImage}
              style={styles.fullscreenActionBtn}
            >
              <Feather name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.fullscreenActionBtnText}>Change Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFullScreenImageVisible(false)}
              style={[styles.fullscreenActionBtn, { backgroundColor: '#18A77A' }]}
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.fullscreenActionBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  scrollContent: {
    backgroundColor: '#EDF2F8',
    paddingBottom: 48,
  },
  headerHero: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 24 : 14,
    paddingBottom: 42,
    paddingHorizontal: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#34D399',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  avatarFallbackText: {
    color: '#065F46',
    fontSize: 18,
    fontWeight: '900',
  },
  cameraIconDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#10B981',
    width: 17,
    height: 17,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSemester: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerGlassBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 35, 75, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    position: 'relative',
  },
  bellBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  profileBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginTop: -28,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  profileBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 14,
  },
  verifiedTagText: {
    color: '#059669',
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
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  collegeBuildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  collegeBuildingBadge: {
    width: 72,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collegeText: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '800',
    lineHeight: 21,
  },
  degreeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  targetStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
  },
  alertIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertExclamationMark: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    lineHeight: 16,
  },
  targetStatusBoxText: {
    flex: 1,
    color: '#334155',
    fontSize: 11.5,
    lineHeight: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  kpiSubText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 2,
  },
  kpiAttendedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiAttendedInnerBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiMissedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiMissedInnerBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#F43F5E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetAdjustCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  targetAdjustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetAdjustTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  targetAdjustSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 2,
  },
  targetValueBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetValueBadgeText: {
    color: '#D97706',
    fontWeight: '900',
    fontSize: 12.5,
  },
  targetBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 7,
    marginTop: 14,
  },
  targetChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 12,
    alignItems: 'center',
  },
  targetChoiceBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  targetChoiceText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12.5,
    fontWeight: '700',
  },
  targetChoiceTextActive: {
    color: '#4338CA',
    fontWeight: '900',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  tabContentWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '800',
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11.5,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  courseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectOrb: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseName: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
  },
  courseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 3,
  },
  courseTypeBadgeText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
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
    padding: 3,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#EEF3F8',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepperContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 7,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepperLabel: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  stepperActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepBtnMinus: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnPlusPresent: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnPlusTotal: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnPlus: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#0F172A',
    fontSize: 13.5,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayChoiceBtnActive: {
    backgroundColor: '#D68B16',
    borderColor: '#D68B16',
  },
  dayChoiceText: {
    color: '#748197',
    fontSize: 11,
    fontWeight: '800',
  },
  dayChoiceTextActive: {
    color: '#F4F7FB',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyCardTitle: {
    color: '#748197',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyAddBtn: {
    backgroundColor: 'rgba(24, 167, 122, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#18A77A',
    fontSize: 12,
    fontWeight: '800',
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: 'rgba(24, 167, 122, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotTimeText: {
    color: '#18A77A',
    fontSize: 11,
    fontWeight: '700',
  },
  slotActionBtn: {
    padding: 4,
  },
  slotSubjectTitle: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '800',
  },
  slotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#EEF3F8',
    paddingTop: 8,
  },
  slotRoomText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  slotTypeBadge: {
    backgroundColor: '#EEF3F8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slotTypeBadgeText: {
    color: '#3778D5',
    fontSize: 10,
    fontWeight: '700',
  },
  plannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  plannerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  plannerSubjectName: {
    color: '#172033',
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
    backgroundColor: '#F4F7FB',
    borderRadius: 8,
    padding: 8,
  },
  plannerAdviceText: {
    flex: 1,
    color: '#45546A',
    fontSize: 11,
    fontWeight: '600',
  },
  manageCardRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paletteDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  manageCardTitle: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '700',
  },
  manageCardMeta: {
    color: '#748197',
    fontSize: 11,
    marginTop: 2,
  },
  manageActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF3F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.48)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '900',
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#172033',
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: '#F4F7FB',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(24, 167, 122, 0.12)',
    borderColor: '#18A77A',
  },
  toggleBtnText: {
    color: '#748197',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#18A77A',
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
    borderColor: '#172033',
    transform: [{ scale: 1.2 }],
  },
  modalSaveBtn: {
    backgroundColor: '#18A77A',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  modalSaveBtnText: {
    color: '#F4F7FB',
    fontWeight: '900',
    fontSize: 13,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF3F8',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  viewModeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewModeToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#24334A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  viewModeToggleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  viewModeToggleTextActive: {
    color: '#18A77A',
  },
  timetableImageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#24334A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  timetableBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expandIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(55, 120, 213, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  expandIconBtnText: {
    color: '#3778D5',
    fontSize: 11,
    fontWeight: '700',
  },
  timetableImageWrap: {
    width: '100%',
    height: 250,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EEF3F8',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timetablePreviewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageOverlayHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  timetableCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#EEF3F8',
  },
  timetableFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  timetableFooterBtnText: {
    color: '#3778D5',
    fontSize: 12,
    fontWeight: '700',
  },
  footerDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
  },
  emptyCardSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  fullscreenModalArea: {
    flex: 1,
    backgroundColor: '#070A13',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0E1322',
    borderBottomWidth: 1,
    borderColor: '#1E293B',
  },
  fullscreenTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  fullscreenSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  fullscreenCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0E1322',
    borderTopWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  fullscreenActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3778D5',
  },
  fullscreenActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Day Impact Analyzer Quick Bar
  quickDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickDayTitle: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  quickDayViewAll: {
    color: '#2563EB',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quickDaySub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
    marginBottom: 10,
  },
  quickDayBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  quickDayBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickDayBtnText: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '800',
  },
  quickDayCountText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },
  // Schedule Tab Buttons
  scheduleAnalyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleAnalyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  scheduleAddPeriodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  scheduleAddPeriodBtnText: {
    color: '#059669',
    fontSize: 11.5,
    fontWeight: '800',
  },
  // Day-by-Day Impact Analyzer Main Container
  analyzerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  analyzerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyzerIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzerMainTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  analyzerSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  analyzerDayBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  analyzerDayBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  analyzerDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 14,
  },
  analyzerDayBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
  },
  analyzerDayBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  analyzerDayBtnText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '800',
  },
  analyzerDayBtnTextActive: {
    color: '#FFFFFF',
  },
  analyzerDayCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  analyzerDayCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  analyzerDayCountText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
  },
  analyzerDayCountTextActive: {
    color: '#FFFFFF',
  },
  analyzerEmptyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyzerEmptyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  analyzerEmptySub: {
    color: '#64748B',
    fontSize: 11.5,
    textAlign: 'center',
  },
  impactComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  impactCardAttend: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  impactCardBunk: {
    flex: 1,
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  impactCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  impactBadgeGreenText: {
    color: '#059669',
    fontSize: 9.5,
    fontWeight: '900',
  },
  impactBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  impactBadgeRedText: {
    color: '#DC2626',
    fontSize: 9.5,
    fontWeight: '900',
  },
  impactSubCount: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  impactDeltaGreen: {
    color: '#059669',
    fontSize: 22,
    fontWeight: '900',
  },
  impactDeltaRed: {
    color: '#DC2626',
    fontSize: 22,
    fontWeight: '900',
  },
  impactProjectedText: {
    color: '#334155',
    fontSize: 11,
    marginTop: 2,
  },
  impactStatusGreen: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  impactStatusRed: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  verdictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  verdictBannerText: {
    flex: 1,
    color: '#334155',
    fontSize: 11.5,
    lineHeight: 16,
  },
  simCardContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simCardTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  simCardSub: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  simPresetBtnAttend: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simPresetBtnAttendText: {
    color: '#15803D',
    fontSize: 10.5,
    fontWeight: '800',
  },
  simPresetBtnBunk: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simPresetBtnBunkText: {
    color: '#B91C1C',
    fontSize: 10.5,
    fontWeight: '800',
  },
  simLiveBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  simLiveBarText: {
    color: '#1E40AF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  simLiveBarPct: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '900',
  },
  simSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  simSlotTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  simSlotTimeText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  simSlotTypeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  simSlotTypeBadgeText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
  },
  simSlotSubject: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  simImpactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  simImpactCurr: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  simImpactSep: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  simImpactDelta: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  simUnmatchedText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  simToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  simToggleBtnAttend: {
    backgroundColor: '#DCFCE7',
  },
  simToggleBtnBunk: {
    backgroundColor: '#FEE2E2',
  },
  simToggleBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  simToggleBtnTextAttend: {
    color: '#15803D',
  },
  simToggleBtnTextBunk: {
    color: '#B91C1C',
  },
  simApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  simApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  impactModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  impactModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
  },
  impactModeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  impactModeBtnText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  impactModeBtnTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  multiStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginVertical: 10,
  },
  multiStepBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiStepValueBox: {
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    alignItems: 'center',
  },
  multiStepValueText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  multiPresetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  multiPresetBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  multiPresetBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  multiPresetBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  multiPresetBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  multiDaySeqContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  multiDaySeqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  multiDaySeqName: {
    color: '#1E293B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  multiDaySeqCount: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
});
