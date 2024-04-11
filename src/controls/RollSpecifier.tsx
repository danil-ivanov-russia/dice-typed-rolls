import { useEffect, useMemo, useState } from "react";

import OBR from "@owlbear-rodeo/sdk";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import InputOutlined from "@mui/icons-material/InputOutlined";
import { getDiceToRoll, useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";
// use a peggy.js parser to parse the specifier string
import * as peggy from "peggy";
import { DiceType } from "../types/DiceType";
import { Die } from "../types/Die";
import { useDiceHistoryStore } from "./history";
import { TRAY_SIZE_MODIFIER } from "../tray/InteractiveTray";

type RollSpecifierProps = {
};

// the grammar for the roll specifier
const diceRollGrammar = `
{
  function parseRoll(rolls, sides, modifier) {
    var total = 0;
    var theRolls = [];
    var resultObject = {sides: parseInt(sides), modifier: modifier, rolls: theRolls};
    for (var i = 0; i < rolls; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      theRolls.push(roll);
      total += roll;
    }
    resultObject.total = total + modifier;
    return resultObject;
  }
}
start = dice_roll
dice_roll
  = _ rolls:number? _ "d"i _ sides:dice_sides _ modifier:modifier? _
    { return parseRoll(rolls || 1, sides, modifier || 0); }
dice_sides
  = "100" / "20" / "12" / "10" / "8" / "6" / "4" / "2"
modifier
  = sign:("+" / "-")? _ n:number
    { return (sign === "-" ? -n : n); }
number
  = digits:[0-9]+
    { return parseInt(digits.join(''), 10); }
_ "whitespace"
  = [ \\t\\r\\n]*
`;

// build a parser from the grammar in DiceRollGrammar.pegjs
const parser = peggy.generate(diceRollGrammar);

function RollSpecifier({
}: RollSpecifierProps) {

  const [specifierString, setSpecifierString] = useState(``);
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const defaultDiceCounts = useDiceControlsStore(
    (state) => state.defaultDiceCounts
  );
  const diceSet = useDiceControlsStore((state) => state.diceSet);
  const diceSetId = diceSet.id !== "all" ? diceSet.id : 'GALAXY_STANDARD';

  const setBonus = useDiceControlsStore((state) => state.setDiceBonus);
  const incrementDieCount = useDiceControlsStore((state) => state.incrementDieCount);
  const resetDiceCounts = useDiceControlsStore((state) => state.resetDiceCounts);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const roll = useDiceRollStore((state) => state.roll);
  const diceById = useDiceControlsStore((state) => state.diceById);
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const bonus = useDiceControlsStore((state) => state.diceBonus);
  const advantage = useDiceControlsStore((state) => state.diceAdvantage);
  const setAdvantage = useDiceControlsStore((state) => state.setDiceAdvantage);
  const startRoll = useDiceRollStore((state) => state.startRoll);
  const pushRecentRoll = useDiceHistoryStore((state) => state.pushRecentRoll);
  function clearRollIfNeeded() {
    if (roll) {
      clearRoll();
    }
  }

  const rollValues = useDiceRollStore((state) => state.rollValues);
  const finishedRolling = useMemo(() => {
    const values = Object.values(rollValues);
    if (values.length === 0) {
      return true;
    } else {
      return values.every((value) => value !== null);
    }
  }, [rollValues]);

  function handleRoll() {
        if (!Object.entries(defaultDiceCounts).every(
            ([type, count]) => counts[type as DiceType] === count
          )) {
          const dice = getDiceToRoll(counts, advantage, diceById);
          startRoll({ dice, bonus, hidden });
    
          const rolledDiceById: Record<string, Die> = {};
          for (const id of Object.keys(counts)) {
            if (!(id in rolledDiceById)) {
              rolledDiceById[id] = diceById[id];
            }
          }
          pushRecentRoll({ advantage, counts, bonus, diceById: rolledDiceById });
    
          handleReset();
        }
  }

  function handleReset() {
    resetDiceCounts();
    setBonus(0);
    setAdvantage(null);
  }

  async function prepareRoll() {
    try {
        const rollSpec = parser.parse(specifierString);
        clearRollIfNeeded();
        resetDiceCounts();
        for (let i = 0; i < rollSpec.rolls.length; i++) {
          incrementDieCount(`${diceSetId}_D${rollSpec.sides}`);
        }
        setBonus(rollSpec.modifier);
    }
    catch (e) {
        OBR.notification.show(`Error: Incorrect roll input "${specifierString}"`, "ERROR")
    }
  }

  function handleRollLaunch() {
    if (finishedRolling) {
        prepareRoll()
        setInputSubmitted(true);
    }
  }

  const hasDice = useMemo(
    () =>
      !Object.entries(defaultDiceCounts).every(
        ([type, count]) => counts[type as DiceType] === count
      ),
    [counts, defaultDiceCounts]
  );

  useEffect(() => {
    if (hasDice && inputSubmitted) {
        setInputSubmitted(false);
        handleRoll()
    }
  }, [hasDice, inputSubmitted, setInputSubmitted])

  const trayHeight = window.innerHeight * (0.1 - TRAY_SIZE_MODIFIER)


  return (
    <Stack style={{height: trayHeight, alignItems: 'center', flexGrow: 1, justifyContent: 'center', margin: 8}}>
          <TextField
            onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key == "Enter") {
                    handleRollLaunch()
                }
            }}
            InputProps={{endAdornment: (
                <IconButton
                  aria-label="specify roll parameters"
                  onClick={handleRollLaunch}
                >
                  <InputOutlined />
                </IconButton>)
                }}
            value={specifierString}
            onChange={(e) => {
              setSpecifierString(e.target.value);
            }}
            placeholder="1d20+3"
            fullWidth
          />
        </Stack>
        )
}

export default RollSpecifier