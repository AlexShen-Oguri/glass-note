import {motionData} from '../motion/attributes';
import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import type {OrderCard,OrderSimpleFormatCopy} from '../../domain/order';
import type {Locale} from '../../domain/contracts';
import {orderCopy} from '../../i18n/round17-5-order';
import {tm,type TasteKey} from '../../i18n/taste';
import {useViewport} from '../discovery/components';
import {OrderCardVisual} from './OrderCardVisual';
import {orderStyles as s} from './orderStyles';
import {MotionModal} from '../motion/primitives';

export function OrderCardModal({visible,card,locale,copy,motionEnabled,onClose,onViewRecipe}:{visible:boolean;card:OrderCard;locale:Locale;copy:OrderSimpleFormatCopy;motionEnabled:boolean;onClose:()=>void;onViewRecipe:()=>void}){
  const {width}=useViewport(),compact=width<560;
  return <MotionModal motionDisabled={!motionEnabled} transparent visible={visible} animationType={motionEnabled ? 'fade' : 'none'} onRequestClose={onClose}>
    <View style={[s.modalBackdrop,compact&&s.modalBackdropCompact,{zIndex:0}]}>
      <View {...motionData({motionSurface: ''})} accessibilityViewIsModal style={[s.modalSurface,{zIndex:1}]}>
        <View style={s.modalHeader}>
          <Text style={s.modalHeading}>{tm(locale,'orderTitle' as TasteKey)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={orderCopy(locale,'closeCard')} onPress={onClose} style={({pressed})=>[s.closeButton,pressed&&{opacity:.68}]}>
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalContent}>
          <OrderCardVisual card={card} copy={copy}/>
        </ScrollView>
        <View style={s.modalFooter}>
          <Pressable accessibilityRole="button" accessibilityLabel={orderCopy(locale,'viewRecipe')} onPress={onViewRecipe} style={({pressed})=>[s.modalFooterButton,pressed&&{opacity:.68}]}>
            <Text style={s.modalFooterButtonText}>{orderCopy(locale,'viewRecipe')}</Text>
          </Pressable>
        </View>
      </View>
      <Pressable accessible={false} focusable={false} accessibilityElementsHidden importantForAccessibility="no" tabIndex={-1} onPress={onClose} style={[StyleSheet.absoluteFill,{zIndex:0}]} />
    </View>
  </MotionModal>;
}
