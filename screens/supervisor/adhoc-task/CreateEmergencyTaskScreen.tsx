import WorkerMatchCard from "@/components/cards/worker-match-card";
import DropdownSelect from "@/components/forms/dropdown-select";
import SkillChip from "@/components/forms/skill-chip";
import UrgencySelector from "@/components/forms/urgency-selector";
import { SupervisorStackParamList } from "@/navigation/AppNavigator";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type UrgencyLevel = "Normal" | "High" | "Critical";

type Props = NativeStackScreenProps<
  SupervisorStackParamList,
  "CreateEmergencyTask"
>;

export default function CreateEmergencyTaskScreen({ navigation }: Props) {
  const [taskType, setTaskType] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Normal");
  const [location, setLocation] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    "Deep Cleaning",
    "Hazardous Waste",
  ]);
  const [startImmediately, setStartImmediately] = useState(false);

  const skills = [
    "Deep Cleaning",
    "Chemical Handling",
    "Floor Polish",
    "Hazardous Waste",
  ];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleReset = () => {
    setTaskType("");
    setUrgency("Normal");
    setLocation("");
    setSelectedSkills([]);
    setStartImmediately(false);
  };

  const handleCreate = () => {
    // TODO: Implement create task logic
    console.log("Creating task...");
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FA" />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Emergency Task</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Task Type */}
          <DropdownSelect
            label="Task Type"
            placeholder="Select task category..."
            value={taskType}
            onPress={() => {}}
          />

          {/* Urgency Level */}
          <UrgencySelector
            label="Urgency Level"
            value={urgency}
            onChange={setUrgency}
          />

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.locationHeader}>
              <Text style={styles.label}>Location</Text>
              <TouchableOpacity style={styles.useLocationButton}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.useLocationText}>Use my location</Text>
              </TouchableOpacity>
            </View>

            {/* Search Location */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search building or room..."
                placeholderTextColor="#94A3B8"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Required Skills */}
          <View style={styles.section}>
            <Text style={styles.label}>Required Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <SkillChip
                  key={skill}
                  label={skill}
                  selected={selectedSkills.includes(skill)}
                  onPress={() => toggleSkill(skill)}
                />
              ))}
            </View>
          </View>

          {/* Worker Matches */}
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.workersScroll}
            >
              <WorkerMatchCard
                name="Marcus Chen"
                distance="0.2 miles away"
                rating={4.9}
                matchScore={98}
                isBestMatch
              />
              <WorkerMatchCard
                name="Sarah Johnson"
                distance="0.5 miles away"
                rating={4.7}
                matchScore={95}
              />
            </ScrollView>
          </View>

          {/* Start Immediately */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>⚡</Text>
              <View>
                <Text style={styles.toggleTitle}>Start Immediately</Text>
                <Text style={styles.toggleSubtitle}>
                  Dispatch worker upon creation
                </Text>
              </View>
            </View>
            <Switch
              value={startImmediately}
              onValueChange={setStartImmediately}
              trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
              thumbColor="#FFF"
            />
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 40 }} />

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create Emergency Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 20,
    color: "#64748B",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  resetButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  useLocationButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  useLocationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  mapContainer: {
    marginBottom: 12,
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  mapIcon: {
    fontSize: 48,
    opacity: 0.3,
  },
  pinRed: {
    position: "absolute",
    top: 50,
    left: "45%",
  },
  pinBlue: {
    position: "absolute",
    top: 90,
    left: "50%",
  },
  pinIcon: {
    fontSize: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1E293B",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  createButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  workersScroll: {
    paddingRight: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
  },
});
