'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ImageWithSkeleton from './ImageWithSkeleton';
import { useCart } from '@/context/CartContext';
import { useSelector } from 'react-redux';
import {
  fetchCategories,
  fetchSubCategories,
} from '@/lib/api';
import './CartSidebar.css';
import './Header.css';

// Indian grouping for mini-cart amounts, e.g. 2300 -> "2,300".
function formatPrice(value) {
  return new Intl.NumberFormat('en-IN').format(value);
}

const MENU_DEFINITIONS = [
  {
    slug: 'living-room',
    label: 'LIVING',
    items: [
      { name: 'Sofa', slug: 'sofa' },
      { name: 'Coffee Table', slug: 'coffee-table' },
      { name: 'TV Unit', slug: 'tv-unit' },
      { name: 'Recliner', slug: 'recliner' },
      { name: 'Sofa Cum Bed', slug: 'sofa-cum-bed' },
      { name: 'L-Shape Sofa', slug: 'l-shape-sofa' },
      { name: 'Sectional Sofa', slug: 'sectional-sofa' },
      { name: 'Wooden Jhula', slug: 'wooden-jhula' },
      { name: 'Center Table', slug: 'center-table' },
      { name: 'Side Table', slug: 'side-table' },
    ],
  },
  {
    slug: 'sofa-menu',
    parentSlug: 'living-room',
    label: 'SOFA',
    items: [
      { name: '1-Seater Sofa', slug: '1-seater-sofa' },
      { name: '2-Seater Sofa', slug: '2-seater-sofa' },
      { name: '3-Seater Sofa', slug: '3-seater-sofa' },
      { name: 'L-Shape Sofa', slug: 'l-shape-sofa' },
      { name: 'Sectional Sofa', slug: 'sectional-sofa' },
      { name: 'Sofa Cum Bed', slug: 'sofa-cum-bed' },
      { name: 'Recliner', slug: 'recliner' },
      { name: 'Wooden Jhula', slug: 'wooden-jhula' },
    ],
  },
  {
    slug: 'bedroom',
    label: 'BEDROOM',
    items: [
      { name: 'Bed', slug: 'bed' },
      { name: 'Wardrobe', slug: 'wardrobe' },
      { name: 'Dressing Table', slug: 'dressing-table' },
      { name: 'Bedside Table', slug: 'bedside-table' },
      { name: 'Chest of Drawers', slug: 'chest-of-drawers' },
      { name: 'King Size Bed', slug: 'king-size-bed' },
      { name: 'Queen Size Bed', slug: 'queen-size-bed' },
    ],
  },
  {
    slug: 'study-room',
    label: 'STUDY ROOM',
    items: [
      { name: 'Study Table', slug: 'study-table' },
      { name: 'Bookshelf', slug: 'bookshelf' },
      { name: 'Office Chair', slug: 'office-chair' },
      { name: 'Laptop Table', slug: 'laptop-table' },
      { name: 'Ergonomic Chair', slug: 'ergonomic-chair' },
      { name: 'Bookcase', slug: 'bookcase' },
    ],
  },
  {
    slug: 'dining-room',
    label: 'DINING ROOM',
    items: [
      { name: 'Dining Table', slug: 'dining-table' },
      { name: 'Dining Chair', slug: 'chair' },
      { name: 'Bar Stool', slug: 'bar-stool' },
      { name: 'Kitchen Trolley', slug: 'kitchen-trolley' },
      { name: '4-Seater Dining', slug: '4-seater-dining' },
      { name: '6-Seater Dining', slug: '6-seater-dining' },
    ],
  },
  {
    slug: 'outdoor',
    label: 'OUTDOOR',
    items: [
      { name: 'Garden Bench', slug: 'garden-bench' },
      { name: 'Swing / Jhula', slug: 'swing-jhula' },
      { name: 'Plant Stand', slug: 'plant-stand' },
      { name: 'Outdoor Chair', slug: 'outdoor-chair' },
      { name: 'Patio Set', slug: 'patio-set' },
    ],
  },
];

export default function Header() {
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const { cart, getCartTotal } = useCart();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getCartTotal();

  // Navbar categories, loaded from the public categories API.
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Guards against a slow response overwriting state after unmount.
    let cancelled = false;

    // Loads the top-level categories, then each category's sub-categories in parallel. The public
    // API applies the soft-delete filter (status: 1, deleted_at: null), so only live records show.
    async function loadNavCategories() {
      const list = await fetchCategories();

      if (cancelled || !Array.isArray(list) || list.length === 0) {
        // API unavailable or empty -> keep the static-only menu.
        return;
      }

      const withSubCategories = await Promise.all(
        list.map(async (category) => {
          // A failing sub-category fetch yields [] -> that entry is rendered as a single
          // link to /shop?category=<slug>, so a partial failure never blanks the nav.
          const subCategories = await fetchSubCategories(category.id);
          return { ...category, subCategories: Array.isArray(subCategories) ? subCategories : [] };
        })
      );

      if (cancelled) {
        return;
      }

      setCategories(withSubCategories);
    }

    loadNavCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const navCategories = MENU_DEFINITIONS.map((definition) => {
    const sourceCategory = categories.find(
      (category) => category.slug === (definition.parentSlug || definition.slug)
    );
    const subCategories = sourceCategory?.subCategories || [];

    return {
      id: definition.slug,
      slug: definition.slug,
      name: definition.label,
      subCategories: definition.items.flatMap((item) => {
        const subCategory = subCategories.find((entry) => entry.slug === item.slug);
        return subCategory
          ? [{ ...subCategory, name: item.name, href: `/shop?sub_category=${encodeURIComponent(subCategory.slug)}` }]
          : [];
      }),
    };
  }).filter((category) => category.subCategories.length > 0);

  // Reuse the same category data for the mobile offcanvas tree.
  const categoryNode = (category) => {
    return {
      label: category.name,
      children: category.subCategories.map((sub) => ({
        label: sub.name,
        href: sub.href,
      })),
    };
  };

  const categoryMobileNodes = navCategories.map(categoryNode);

  const pagesMobileNode = {
    label: 'Pages',
    children: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Cart', href: '/cart' },
      { label: 'Checkout', href: '/checkout' },
      { label: 'Frequently Questions', href: '/frequently-questions' },
    ],
  };



  const isLogin = useSelector((data) => {
    return data.login.value;
  })

  useEffect(() => {
    const closeMenu = (event) => {
      if (!(event.target instanceof Element)) return;

      if (!event.target.closest('.main_menu li.menu-open')) {
        setOpenMenu(null);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  useEffect(() => {
    const updateStickyHeader = () => {
      setIsSticky(window.innerWidth >= 992 && window.scrollY > 100);
    };

    updateStickyHeader();
    window.addEventListener('scroll', updateStickyHeader, { passive: true });
    window.addEventListener('resize', updateStickyHeader);

    return () => {
      window.removeEventListener('scroll', updateStickyHeader);
      window.removeEventListener('resize', updateStickyHeader);
    };
  }, []);

  return (
    <>
      <header className="header_area header_two">
        {/* Top bar */}
        <div className="header_top">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-7 col-md-12 col-12">
                <div className="welcome_text">
                  <p>Contact us 24/7 : +91-98745612330 / furniture@gmail.com</p>
                </div>
              </div>
              <div className="col-lg-5 col-md-12 col-12">
                <div className="top_right text-right">
                  <ul>
                    <li className="language">
                      {
                        isLogin
                        ?
                        <Link href="/my-dashboard">My-Dashboard</Link>
                        :
                        <Link href="/login-register">Login / Register</Link>
                      }
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle section */}
        <div className="header_middel">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-lg-2 col-md-3 col-4">
                <div className="logo">
                  <Link href="/">
                    <Image
                      src="/images/logo.png"
                      alt="Logo"
                      width={156}
                      height={40}
                    />
                  </Link>
                </div>
              </div>
              <div className="col-lg-10 col-md-7 col-8">
                <div className="middel_right">
                  <div className="search_btn mobail_none2">
                    <form action="/product-search" className="search-box" autoComplete="off">
                      <input name="search" placeholder="Search product..." type="text" />
                      <button type="submit">
                        <i className="ion-ios-search-strong"></i>
                      </button>
                    </form>
                  </div>
                  <div className="box_setting">
                    <Link href="/wishlist">
                      <i className="ion-heart"></i>
                    </Link>
                  </div>
                  <div className="cart_link">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsCartOpen(true);
                      }}
                    >
                      <i className="ion-android-cart"></i>
                      <span className="cart_text_quantity"> Rs. {totalPrice.toFixed(2)}</span>
                      <i className="fa fa-angle-down"></i>
                    </a>
                    <span className="cart_quantity">{cartItemCount}</span>
                    {/* Mini cart sidebar */}
                    {isCartOpen && (
                      <CartSidebar
                        onClose={() => {
                          setIsCartOpen(false);
                        }}
                      />
                    )}
                  </div>
                </div>
                {/* Mobile hamburger menu trigger - hidden on desktop, shown on mobile */}
                <div className="mobile_menu_toggle">
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsOffcanvasOpen(true); }}>
                    <i className="ion-navicon"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className={`header_bottom sticky-header${isSticky ? ' sticky' : ''}`}>
          <div className="container">
            <div className="row align-items-center">
              <div className="col-12">
                <div className="main_menu_inner">
                  <div className="logo_sticky">
                    <Link href="/">
                      <Image src="/images/logo.png" alt="Logo" width={80} height={30} />
                    </Link>
                  </div>
                  <div className="main_menu">
                    <nav>
                      <ul>
                        <li className="active"><Link href="/">Home</Link></li>
                        {/* Dynamic category dropdowns, one per admin category.
                            Hover is handled by the theme
                            (public/css/style.css:1998 ".main_menu nav ul li:hover .mega_menu")
                            plus the .nav_category rules in Header.css; click and keyboard focus
                            open and close them through the shared `openMenu` state. */}
                        {navCategories.map((category) => (
                          <li
                            key={category.id || category.slug}
                            className={`nav_category${openMenu === category.slug ? ' menu-open' : ''}`}
                            onMouseEnter={() => setOpenMenu(category.slug)}
                            onMouseLeave={() => setOpenMenu(null)}
                          >
                            <a
                              href="#"
                              aria-haspopup="true"
                              aria-expanded={openMenu === category.slug}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMenu((current) => (current === category.slug ? null : category.slug));
                              }}
                            >
                              {category.name} <i className="fa fa-angle-down"></i>
                            </a>
                            <ul className="mega_menu">
                              {category.subCategories.map((sub) => (
                                <li key={sub.id || sub.slug}>
                                  <a>{sub.name}</a>
                                  <ul>
                                    <li>
                                      <Link
                                        href={sub.href}
                                        onClick={() => setOpenMenu(null)}
                                      >
                                        {sub.name}
                                      </Link>
                                    </li>
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                        <li className={`pages_dropdown${openMenu === 'pages' ? ' menu-open' : ''}`}><a
                          href="#"
                          aria-expanded={openMenu === 'pages'}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenu((current) => current === 'pages' ? null : 'pages');
                          }}
                        >Pages</a>
                          <ul className="sub_menu">
                            <li><Link href="/about-us">About Us</Link></li>
                            <li><Link href="/cart">Cart</Link></li>
                            <li><Link href="/checkout">Checkout</Link></li>
                            <li><Link href="/frequently-questions">Frequently Questions</Link></li>
                          </ul>
                        </li>
                        <li><Link href="/contact">Contact Us</Link></li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile offcanvas button */}
      <div
        className={(isOffcanvasOpen || isCartOpen) ? `off_canvars_overlay active${isCartOpen ? ' cart_overlay_open' : ''}` : 'off_canvars_overlay'}
        style={{ display: (isOffcanvasOpen || isCartOpen) ? 'block' : 'none' }}
        onClick={() => {
          setIsOffcanvasOpen(false);
          setIsCartOpen(false);
        }}
      ></div>
      <div className="Offcanvas_menu">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="canvas_open">
                <a href="#" onClick={(e) => { e.preventDefault(); setIsOffcanvasOpen(true); }}>
                  <i className="ion-navicon"></i>
                </a>
              </div>
              <div className={`Offcanvas_menu_wrapper${isOffcanvasOpen ? ' active' : ''}`}>
                <div className="canvas_close">
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsOffcanvasOpen(false); }}>
                    <i className="ion-android-close"></i>
                  </a>
                </div>
                <div className="welcome_text">
                  <p>Contact us 24/7 : +91-98745612330 <span></span></p>
                  <p>furniture@gmail.com <span></span></p>
                </div>
                <div id="menu" className="text-left">
                  <ul className="offcanvas_main_menu">
                    <li><Link href="/" onClick={() => setIsOffcanvasOpen(false)}>Home</Link></li>
                    {/* Same dynamic categories as the desktop bar, in the same order. */}
                    {categoryMobileNodes.map((node) => (
                      <OffcanvasMenuItem
                        key={node.label}
                        node={node}
                        onNavigate={() => setIsOffcanvasOpen(false)}
                      />
                    ))}
                    <OffcanvasMenuItem node={pagesMobileNode} onNavigate={() => setIsOffcanvasOpen(false)} />
                    <li><Link href="/contact" onClick={() => setIsOffcanvasOpen(false)}>Contact Us</Link></li>
                    <li>
                      <Link href={isLogin ? "/my-dashboard" : "/login-register"} onClick={() => setIsOffcanvasOpen(false)}>
                        <i className="ion-android-person"></i>
                        {isLogin ? "My Account" : "Login / Register"}
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="Offcanvas_footer">
                  <span>Copyright &copy; {new Date().getFullYear()} Furniture All rights reserved.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Mini-cart drawer (right-side), styled by the theme's .mini_cart classes
// (public/css/style.css) plus the scoped overrides in CartSidebar.css.
// Visible design follows the reference screenshot: static "Qty: N" text,
// tan price, Subtotal row, and a dark action footer with VIEW CART/CHECKOUT.
// Quantity editing lives on the full /cart page.
function CartSidebar({ onClose }) {
  const { cart, removeFromCart, getCartTotal } = useCart();

  // While the drawer is open, lock the page behind it so the mouse wheel
  // scrolls the cart items instead of the homepage. The previous body
  // overflow value is restored on close/unmount so nothing stays locked.
  // Scoped to this component's lifecycle: it never runs for the mobile
  // offcanvas menu, whose scroll behavior is unchanged.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="mini_cart active mini_cart_scrollable"
      style={{ display: 'block' }}
    >
      <div className="cart_close">
        <div className="cart_text"><h3>cart</h3></div>
        <div className="mini_cart_close">
          <a href="#" onClick={onClose}><i className="ion-android-close"></i></a>
        </div>
      </div>
      {cart.length === 0 ? (
        <div className="cart_item text-center">
          <div className="cart_empty_info">
            <a>
              <img src="/images/my-Order.jpg" alt="" />
            </a>
            <a>Your shopping cart is empty!</a>
          </div>
        </div>
      ) : (
        cart.map((item) => (
          <div key={item.id} className="cart_item">
            <div className="cart_img">
              <ImageWithSkeleton
                src={item.image}
                alt={item.name}
                width={124}
                height={80}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="cart_info">
              <h5><Link href={`/product/${item.slug}`}>{item.name}</Link></h5>
              <p>Qty: {item.quantity}</p>
              <span className="price_cart">Rs. {formatPrice(item.price * item.quantity)}</span>
            </div>
            <div className="cart_remove">
              <a href="#" onClick={() => removeFromCart(item.id)}><i className="ion-android-close"></i></a>
            </div>
          </div>
        ))
      )}
      {cart.length > 0 && (
        <>
          <div className="cart_total">
            <span>Subtotal:</span>
            <span>Rs. {formatPrice(getCartTotal())}</span>
          </div>
          <div className="mini_cart_footer">
            <div className="cart_button">
              <Link href="/cart">View Cart</Link>
            </div>
            <div className="cart_button">
              <Link href="/checkout" className="active">Checkout</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Recursive expandable mobile menu item.
// Matches the theme's expected offcanvas structure:
// li.menu-item-has-children > a + span.menu-expand, nested ul.sub-menu
// (public/css/style.css lines 646-683). Expansion is React state instead of
// the jQuery slinky plugin used by the reference site.
function OffcanvasMenuItem({ node, onNavigate }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    return (
      <li>
        <Link href={node.href} onClick={onNavigate}>{node.label}</Link>
      </li>
    );
  }

  return (
    <li className={open ? 'menu-item-has-children menu-open' : 'menu-item-has-children'}>
      <a
        href="#"
        style={{ paddingRight: '30px' }}
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {node.label}
        <span className="menu-expand" style={{ cursor: 'pointer', padding: '0 5px' }}>
          <i className="fa fa-angle-down"></i>
        </span>
      </a>
      {open && (
        <ul className="sub-menu">
          {node.children.map((child) => (
            <OffcanvasMenuItem key={child.label} node={child} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  );
}
