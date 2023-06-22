/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51NLqSRSJZGY8bkFju2wYeMwdf0lppabVAWZrCepCJc2VM5bFiampsLOb5dbBvZMgK5Amrtrmtiawf32KvHKtTSZv00XqpKh7Mn');

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    console.log('HELLO');
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
     console.log('session IS THERE');

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
