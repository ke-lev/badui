import { ClingyBuddy, clingyBuddyMeta } from "@/components/buddies/clingy-buddy";
import { HungryBuddy, hungryBuddyMeta } from "@/components/buddies/hungry-buddy";
import { OpinionatedBuddy, opinionatedBuddyMeta } from "@/components/buddies/opinionated-buddy";
import { ScreamingBuddy, screamingBuddyMeta } from "@/components/buddies/screaming-buddy";
import { ClassicRunaway, classicRunawayMeta } from "@/components/buttons/classic-runaway";
import { CorneredButton, corneredButtonMeta } from "@/components/buttons/cornered-button";
import { ShrinkingButton, shrinkingButtonMeta } from "@/components/buttons/shrinking-button";
import { DelayedPointer, delayedPointerMeta } from "@/components/cursor/delayed-pointer";
import { HeavyPointer, heavyPointerMeta } from "@/components/cursor/heavy-pointer";
import { MirroredPointer, mirroredPointerMeta } from "@/components/cursor/mirrored-pointer";
import { NearestTarget, nearestTargetMeta } from "@/components/cursor/nearest-target";
import { LeadingCaret, leadingCaretMeta } from "@/components/inputs/leading-caret";
import { LetterName, letterNameMeta } from "@/components/inputs/letter-name";
import { OneTimeCode, oneTimeCodeMeta } from "@/components/inputs/one-time-code";
import { QuantityStepper, quantityStepperMeta } from "@/components/inputs/quantity-stepper";
import { SortedEmail, sortedEmailMeta } from "@/components/inputs/sorted-email";
import type { LibraryEntry } from "@/components/library";
import {
  CheckboxGroup,
  checkboxGroupMeta,
  ConfirmDialog,
  confirmDialogMeta,
  PasswordField,
  passwordFieldMeta,
} from "@/components/specimens/form-specimens";
import {
  DatePicker,
  datePickerMeta,
  PhoneNumber,
  phoneNumberMeta,
  VolumeControl,
  volumeControlMeta,
} from "@/components/specimens/physical-specimens";

/**
 * Every entry in the library, in index order. The collection is built from
 * this list, and so are the cursor companion's Talk lines — both read each
 * entry's `meta`. `entries.test.ts` checks every entry here ships its lines.
 */
export const entries: LibraryEntry[] = [
  { id: "volume-control", component: VolumeControl, meta: volumeControlMeta },
  { id: "date-picker", component: DatePicker, meta: datePickerMeta },
  { id: "password-field", component: PasswordField, meta: passwordFieldMeta },
  { id: "checkboxes", component: CheckboxGroup, meta: checkboxGroupMeta },
  { id: "phone-number", component: PhoneNumber, meta: phoneNumberMeta },
  { id: "confirmation-dialog", component: ConfirmDialog, meta: confirmDialogMeta },
  { id: "classic-runaway", component: ClassicRunaway, meta: classicRunawayMeta },
  { id: "cornered", component: CorneredButton, meta: corneredButtonMeta },
  { id: "shrinking", component: ShrinkingButton, meta: shrinkingButtonMeta },
  { id: "quantity", component: QuantityStepper, meta: quantityStepperMeta },
  { id: "letter-name", component: LetterName, meta: letterNameMeta },
  { id: "leading-caret", component: LeadingCaret, meta: leadingCaretMeta },
  { id: "sorted-email", component: SortedEmail, meta: sortedEmailMeta },
  { id: "one-time-code", component: OneTimeCode, meta: oneTimeCodeMeta },
  { id: "mirrored-pointer", component: MirroredPointer, meta: mirroredPointerMeta },
  { id: "delayed-pointer", component: DelayedPointer, meta: delayedPointerMeta },
  { id: "heavy-pointer", component: HeavyPointer, meta: heavyPointerMeta },
  { id: "nearest-target", component: NearestTarget, meta: nearestTargetMeta },
  { id: "hungry-buddy", component: HungryBuddy, meta: hungryBuddyMeta },
  { id: "opinionated-buddy", component: OpinionatedBuddy, meta: opinionatedBuddyMeta },
  { id: "screaming-buddy", component: ScreamingBuddy, meta: screamingBuddyMeta },
  { id: "clingy-buddy", component: ClingyBuddy, meta: clingyBuddyMeta },
];
