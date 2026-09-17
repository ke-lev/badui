import { ClingyBuddy, clingyBuddyMeta } from "@/components/buddies/clingy-buddy";
import { HungryBuddy, hungryBuddyMeta } from "@/components/buddies/hungry-buddy";
import { OpinionatedBuddy, opinionatedBuddyMeta } from "@/components/buddies/opinionated-buddy";
import { ScreamingBuddy, screamingBuddyMeta } from "@/components/buddies/screaming-buddy";
import { ClassicRunaway, classicRunawayMeta } from "@/components/buttons/classic-runaway";
import { CorneredButton, corneredButtonMeta } from "@/components/buttons/cornered-button";
import { MitosisButton, mitosisButtonMeta } from "@/components/buttons/mitosis-button";
import { PersonalSpace, personalSpaceMeta } from "@/components/buttons/personal-space";
import { ShrinkingButton, shrinkingButtonMeta } from "@/components/buttons/shrinking-button";
import { DelayedPointer, delayedPointerMeta } from "@/components/cursor/delayed-pointer";
import { HeavyPointer, heavyPointerMeta } from "@/components/cursor/heavy-pointer";
import { MirroredPointer, mirroredPointerMeta } from "@/components/cursor/mirrored-pointer";
import { FogOfWar, fogOfWarMeta } from "@/components/experiments/fog-of-war";
import { Asymptote, asymptoteMeta } from "@/components/feedback/asymptote";
import { Skittish, skittishMeta } from "@/components/feedback/skittish";
import { LeadingCaret, leadingCaretMeta } from "@/components/inputs/leading-caret";
import { LetterName, letterNameMeta } from "@/components/inputs/letter-name";
import { SortedEmail, sortedEmailMeta } from "@/components/inputs/sorted-email";
import type { LibraryEntry } from "@/components/library";
import { BackOfTheLine, backOfTheLineMeta } from "@/components/navigation/back-of-the-line";
import { Doubling, doublingMeta } from "@/components/navigation/doubling";
import { Compounding, compoundingMeta } from "@/components/sliders/compounding";
import { Momentum, momentumMeta } from "@/components/sliders/momentum";
import { OneGroove, oneGrooveMeta } from "@/components/sliders/one-groove";
import { PiCker, piCkerMeta } from "@/components/sliders/picker";
import { Rebound, reboundMeta } from "@/components/sliders/rebound";
import { Carry, carryMeta } from "@/components/specimens/carry";
import { LowGear, lowGearMeta } from "@/components/specimens/low-gear";
import { MovingTarget, movingTargetMeta } from "@/components/specimens/moving-target";
import { Recursion, recursionMeta } from "@/components/specimens/recursion";
import { Solidarity, solidarityMeta } from "@/components/specimens/solidarity";

/**
 * Every entry in the library, in index order. The collection is built from
 * this list, and so are the cursor companion's Talk lines — both read each
 * entry's `meta`. `entries.test.ts` checks every entry here ships its lines.
 */
export const entries: LibraryEntry[] = [
  { id: "classic-runaway", component: ClassicRunaway, meta: classicRunawayMeta },
  { id: "cornered", component: CorneredButton, meta: corneredButtonMeta },
  { id: "shrinking", component: ShrinkingButton, meta: shrinkingButtonMeta },
  { id: "personal-space", component: PersonalSpace, meta: personalSpaceMeta },
  { id: "mitosis", component: MitosisButton, meta: mitosisButtonMeta },
  { id: "moving-target", component: MovingTarget, meta: movingTargetMeta },
  { id: "solidarity", component: Solidarity, meta: solidarityMeta },
  { id: "carry", component: Carry, meta: carryMeta },
  { id: "letter-name", component: LetterName, meta: letterNameMeta },
  { id: "leading-caret", component: LeadingCaret, meta: leadingCaretMeta },
  { id: "sorted-email", component: SortedEmail, meta: sortedEmailMeta },
  { id: "momentum", component: Momentum, meta: momentumMeta },
  { id: "picker", component: PiCker, meta: piCkerMeta },
  { id: "one-groove", component: OneGroove, meta: oneGrooveMeta },
  { id: "rebound", component: Rebound, meta: reboundMeta },
  { id: "compounding", component: Compounding, meta: compoundingMeta },
  { id: "low-gear", component: LowGear, meta: lowGearMeta },
  { id: "mirrored-pointer", component: MirroredPointer, meta: mirroredPointerMeta },
  { id: "delayed-pointer", component: DelayedPointer, meta: delayedPointerMeta },
  { id: "heavy-pointer", component: HeavyPointer, meta: heavyPointerMeta },
  { id: "hungry-buddy", component: HungryBuddy, meta: hungryBuddyMeta },
  { id: "opinionated-buddy", component: OpinionatedBuddy, meta: opinionatedBuddyMeta },
  { id: "screaming-buddy", component: ScreamingBuddy, meta: screamingBuddyMeta },
  { id: "clingy-buddy", component: ClingyBuddy, meta: clingyBuddyMeta },
  { id: "back-of-the-line", component: BackOfTheLine, meta: backOfTheLineMeta },
  { id: "doubling", component: Doubling, meta: doublingMeta },
  { id: "asymptote", component: Asymptote, meta: asymptoteMeta },
  { id: "skittish", component: Skittish, meta: skittishMeta },
  { id: "recursion", component: Recursion, meta: recursionMeta },
  { id: "fog-of-war", component: FogOfWar, meta: fogOfWarMeta },
];
