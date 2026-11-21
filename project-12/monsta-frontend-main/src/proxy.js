import { NextResponse } from 'next/server';
import React from 'react'

export default function proxy(request) {

  let cookies = request.cookies.get('user_login')?.value;

  var isLogin;

  if(cookies == undefined){
    isLogin = 0;
  } else {
    isLogin = 1;
  }

  if(isLogin == 1 && request.nextUrl.pathname.startsWith('/login-register')){
    return NextResponse.redirect(new URL('/', request.url))
  }

  if(isLogin == 0 && request.nextUrl.pathname.startsWith('/my-dashboard')){
    return NextResponse.redirect(new URL('/login-register', request.url))
  }

  if(isLogin == 0 && request.nextUrl.pathname.startsWith('/checkout')){
    return NextResponse.redirect(new URL('/login-register', request.url))
  }

  return NextResponse.next();
}
