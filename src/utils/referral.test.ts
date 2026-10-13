import assert from 'node:assert/strict';
import { test } from 'node:test';
import { referralLabel, withReferral } from './referral.ts';

const WA = 'https://wa.me/593987838130?text=%C2%A1Hola%20Pawreli!%20Quiero%20mi%20placa';

test('known sources map to a readable label', () => {
  assert.equal(referralLabel('?ref=ig'), 'Instagram');
  assert.equal(referralLabel('?utm=x&ref=TT'), 'TikTok');
});

test('unknown or missing sources are ignored (no free text reaches the message)', () => {
  assert.equal(referralLabel(''), undefined);
  assert.equal(referralLabel('?ref=<script>'), undefined);
  assert.equal(referralLabel('?ref=toString'), undefined);
});

test('the origin is appended to the prefilled WhatsApp text', () => {
  const text = new URL(withReferral(WA, 'Instagram')).searchParams.get('text');
  assert.equal(text, '¡Hola Pawreli! Quiero mi placa (vengo de Instagram)');
});

test('spaces stay %20-encoded like whatsappLink(), never "+"', () => {
  assert.ok(!withReferral(WA, 'Instagram').includes('+'));
});

test('non-WhatsApp links are left untouched', () => {
  assert.equal(withReferral('/precios', 'Instagram'), '/precios');
});
