// src/components/task/steps/index.ts

import { registerStep } from "../StepRegistry";

import { CheckinStepPlugin } from "./CheckinStep"; // x-behavior: checkin
import { ChecklistStepPlugin } from "./ChecklistStep"; // x-behavior: checklist
import { EquipmentStepPlugin } from "./EquipmentStep"; // x-behavior: equipment-check
import { ListStepPlugin } from "./ListStep"; // x-behavior: list
import { NoteStepPlugin } from "./NoteStep"; // x-behavior: finish
import { PhotoStepPlugin } from "./PhotoStep"; // x-behavior: photo-capture
import { PpeStepPlugin } from "./PpeStep"; // x-behavior: ai-ppe-check

registerStep(CheckinStepPlugin);
registerStep(PpeStepPlugin);
registerStep(EquipmentStepPlugin);
registerStep(PhotoStepPlugin);
registerStep(ChecklistStepPlugin);
registerStep(ListStepPlugin);
registerStep(NoteStepPlugin);

// Thêm step mới: tạo file + import + registerStep ở đây
