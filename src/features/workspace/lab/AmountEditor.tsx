import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Text, View} from 'react-native';
import type {Locale} from '../../../domain/contracts';
import {
  commitLabAmount,
  convertLabAmountDraft,
  displayLabAmount,
} from '../../../domain/lab/measure';
import {labRefinementText} from '../../../i18n/lab-refinement';
import {useApp} from '../../../platform/AppProvider';
import {Action, Field, Fold, ws} from '../ui';

export function AmountEditor({
  amount,
  unit,
  locale,
  amountLabel,
  unitLabel,
  onCommit,
}: {
  amount: string;
  unit: string;
  locale: Locale;
  amountLabel: string;
  unitLabel: string;
  onCommit: (amount: string, unit: string) => void;
}) {
  const {unit: preference} = useApp();
  const display = useMemo(() => displayLabAmount(amount, unit, preference), [amount, preference, unit]);
  const [editorAmount, setEditorAmount] = useState(display.amount);
  const [editorUnit, setEditorUnit] = useState(display.unit);
  const [amountEdited, setAmountEdited] = useState(false);
  const [unitEdited, setUnitEdited] = useState(false);
  const inputValue = useRef({amount: display.amount, unit: display.unit});
  const dirty = amountEdited || unitEdited;
  const text = (key: Parameters<typeof labRefinementText>[1]) => labRefinementText(locale, key);

  useEffect(() => {
    if (dirty) return;
    setEditorAmount(display.amount);
    setEditorUnit(display.unit);
    inputValue.current = {amount: display.amount, unit: display.unit};
  }, [dirty, display.amount, display.unit]);

  const reset = () => {
    setEditorAmount(display.amount);
    setEditorUnit(display.unit);
    inputValue.current = {amount: display.amount, unit: display.unit};
    setAmountEdited(false);
    setUnitEdited(false);
  };

  const chooseVolumeUnit = (nextUnit: 'ml' | 'oz') => {
    if (nextUnit === editorUnit) return;
    if (!amountEdited) {
      const nextDisplay = displayLabAmount(amount, unit, nextUnit);
      setEditorAmount(nextDisplay.amount);
    } else {
      const converted = convertLabAmountDraft(inputValue.current.amount, inputValue.current.unit, nextUnit);
      if (converted !== null) {
        setEditorAmount(converted.editorAmount);
        inputValue.current = {amount: converted.commitAmount, unit: converted.unit};
      }
    }
    setEditorUnit(nextUnit);
    setUnitEdited(nextUnit !== display.unit);
  };

  const apply = () => {
    if (!dirty) return;
    const canonical = inputValue.current;
    const next = commitLabAmount({
        sourceAmount: amount,
        sourceUnit: unit,
        editorAmount: amountEdited ? canonical.amount : editorAmount,
        editorUnit,
        amountEdited,
        unitEdited,
      });
    if (next.amount !== amount || next.unit !== unit) onCommit(next.amount, next.unit);
    setAmountEdited(false);
    setUnitEdited(false);
  };

  return <Fold title={`${text('editAmount')} · ${display.amount || '—'}${display.amount && display.unit ? ` ${display.unit}` : ''}`}>
    <Text style={ws.muted}>{text('preferredUnitHint')}</Text>
    <View style={ws.twoCol}>
      <View style={[ws.column, {flexBasis: 140}]}>
        <Field label={amountLabel} value={editorAmount} maxLength={100} onChange={value => {
          setEditorAmount(value);
          inputValue.current = {amount: value, unit: editorUnit};
          // Input is intentional even when the same characters were shown in
          // another unit before this edit.
          setAmountEdited(true);
        }}/>
      </View>
      <View style={[ws.column, {flexBasis: 140}]}>
        <Field label={unitLabel} value={editorUnit} maxLength={100} onChange={value => {
          setEditorUnit(value);
          inputValue.current = {amount: editorAmount, unit: value};
          // Free-form units relabel the visible draft. The buttons below are
          // the explicit quantity-conversion path.
          setAmountEdited(true);
          setUnitEdited(value !== display.unit);
        }}/>
      </View>
    </View>
    <View style={ws.row}>
      <Action label="ml" selected={editorUnit === 'ml'} onPress={() => chooseVolumeUnit('ml')}/>
      <Action label="fl oz" selected={editorUnit === 'oz'} onPress={() => chooseVolumeUnit('oz')}/>
    </View>
    <Text style={ws.muted}>{text('unitShortcutHint')}</Text>
    <View style={ws.row}>
      <Action label={text('applyAmount')} selected disabled={!dirty} onPress={apply}/>
      {dirty&&<Action label={text('discardAmount')} quiet onPress={reset}/>}
    </View>
  </Fold>;
}
