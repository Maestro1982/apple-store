import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useSelector } from 'react-redux';
import { selectBasketItems, selectBasketTotal } from '../redux/basketSlice';
import { useRouter } from 'next/router';
import Button from '../components/Button';
import CheckoutProduct from '../components/CheckoutProduct';
import Currency from 'react-currency-formatter';
import { ChevronDownIcon } from '@heroicons/react/outline';
import { Stripe } from 'stripe';
import { fetchPostJSON } from '../utils/api-helpers';
import getStripe from '../utils/get-stripejs';

const Checkout = () => {
  const items = useSelector(selectBasketItems);
  const basketTotal = useSelector(selectBasketTotal);
  const router = useRouter();
  const [groupedItemsInBasket, setGroupedItemsInBasket] = useState(
    {} as { [key: string]: Product[] }
  );
  const [loading, setIsLoading] = useState(false);

  // Will run when the component is rendered (Mounted), and everytime the items changes it will re-calculate the amount of items that are present
  useEffect(() => {
    const groupedItems = items.reduce((results, item) => {
      (results[item._id] = results[item._id] || []).push(item);
      return results;
    }, {} as { [key: string]: Product[] });
    setGroupedItemsInBasket(groupedItems);
  }, [items]);

  const createCheckoutSession = async () => {
    setIsLoading(true);
    const checkoutSession: Stripe.Checkout.Session = await fetchPostJSON(
      '/api/checkout_sessions',
      {
        items: items,
      }
    );

    // Internal server error
    if ((checkoutSession as any).statusCode === 500) {
      console.error((checkoutSession as any).message);
      return;
    }

    // Redirect to Checkout.
    const stripe = await getStripe();
    const { error } = await stripe!.redirectToCheckout({
      // Make the id field from the Checkout Session creation API response
      // available to this file, so you can provide it as parameter here
      // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
      sessionId: checkoutSession.id,
    });
    // If `redirectToCheckout` fails due to a browser or network
    // error, display the localized error message to your customer
    // using `error.message`.
    console.warn(error.message);
    setIsLoading(false);
  };

  return (
    <div className='min-h-screen overflow-hidden bg-[#E7ECEE]'>
      <Head>
        <title>Shopping Bag - Apple</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Header />
      <main className='mx-auto max-w-5xl pb-24'>
        <div className='px-5'>
          <h1 className='my-4 text-xl font-semibold lg:text-2xl'>
            {items.length > 0
              ? 'Review your shopping bag.'
              : 'Your shopping bag is empty.'}
          </h1>
          <p className='my-4'>Free delivery and returns.</p>
          {items.length === 0 && (
            <Button
              title='Continue Shopping'
              onClick={() => router.push('/')}
            />
          )}
        </div>
        {items.length > 0 && (
          <div className='mx-5 md:mx-8'>
            {Object.entries(groupedItemsInBasket).map(([key, items]) => (
              <CheckoutProduct key={key} items={items} id={key} />
            ))}
            <div className='my-12 mt-6 ml-auto max-w-3xl'>
              <div className='divide-y divide-gray-300'>
                <div className='pb-4'>
                  <div className='flex justify-between'>
                    <p>Subtotal</p>
                    <p>
                      <Currency quantity={basketTotal} currency='EUR' />
                    </p>
                  </div>
                  <div className='flex justify-between'>
                    <p>Shipping</p>
                    <p>FREE</p>
                  </div>
                  <div className='flex justify-between'>
                    <div className='flex flex-col gap-x-1 lg:flex-row'>
                      Estimated tax for: {''}
                      <p className='flex cursor-pointer items-end text-blue-500 hover:underline'>
                        Enter zip code
                        <ChevronDownIcon className='h-6 w-6' />
                      </p>
                    </div>
                    <p>??? -</p>
                  </div>
                </div>
                <div className='flex justify-between pt-4 text-xl font-semibold'>
                  <h4>Total</h4>
                  <h4>
                    <Currency quantity={basketTotal} currency='EUR' />
                  </h4>
                </div>
              </div>
              <div className='my-14 space-y-4'>
                <h4 className='text-xl font-semibold'>
                  How would you like to checkout?
                </h4>
                <div className='flex flex-col gap-4 md:flex-row'>
                  <div className='order-2 flex flex-1 flex-col items-center rounded-xl bg-gray-200 p-8 py-12 text-center'>
                    <h4 className='mb-4 flex flex-col text-xl font-semibold'>
                      <span>Pay Monthly</span>
                      <span>with Apple Card</span>
                      <span>
                        ???283.16/mo. at 0% APR<sup className='-top-1'>???</sup>
                      </span>
                    </h4>
                    <Button title='Checkout with Apple Card Monthly Installments' />
                    <p className='mt-2 max-w-[240px] text-[13px]'>
                      ???0.00 due today, which includes applicable full-price
                      items, down payments, shipping, and taxes.
                    </p>
                  </div>
                  <div className='flex flex-1 flex-col items-center rounded-xl bg-gray-200 p-8 py-12 md:order-2'>
                    <h4 className='mb-4 flex flex-col text-xl font-semibold'>
                      Pay in full
                      <span>
                        <Currency quantity={basketTotal} currency='EUR' />
                      </span>
                    </h4>
                    <Button
                      loading={loading}
                      noIcon
                      title='Checkout'
                      width='w-full'
                      onClick={createCheckoutSession}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Checkout;
