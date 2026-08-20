# Shared Contracts

## Contract 1: Payment Handoff (A ↔ C)
```typescript
// In BookAppointment.tsx (Person C's file):
const { orderId } = await createPaymentOrder(appointmentDraft); // calls Person A's service
return <PaymentCheckout orderId={orderId} onSuccess={finalizeAppointment} />; // Person A's component
// onSuccess → marks appointment as confirmed + paid via API
```
