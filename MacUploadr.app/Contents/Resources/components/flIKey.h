/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM flIKey.idl
 */

#ifndef __gen_flIKey_h__
#define __gen_flIKey_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    flIKey */
#define FLIKEY_IID_STR "30d5eeac-87fa-11dc-8314-0800200c9a66"

#define FLIKEY_IID \
  {0x30d5eeac, 0x87fa, 0x11dc, \
    { 0x83, 0x14, 0x08, 0x00, 0x20, 0x0c, 0x9a, 0x66 }}

class NS_NO_VTABLE flIKey : public nsISupports {
 public: 

  NS_DEFINE_STATIC_IID_ACCESSOR(FLIKEY_IID)

  /* AString key (); */
  NS_IMETHOD Key(nsAString & _retval) = 0;

  /* AString sign (in AString args); */
  NS_IMETHOD Sign(const nsAString & args, nsAString & _retval) = 0;

};

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_FLIKEY \
  NS_IMETHOD Key(nsAString & _retval); \
  NS_IMETHOD Sign(const nsAString & args, nsAString & _retval); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_FLIKEY(_to) \
  NS_IMETHOD Key(nsAString & _retval) { return _to Key(_retval); } \
  NS_IMETHOD Sign(const nsAString & args, nsAString & _retval) { return _to Sign(args, _retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_FLIKEY(_to) \
  NS_IMETHOD Key(nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Key(_retval); } \
  NS_IMETHOD Sign(const nsAString & args, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Sign(args, _retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class flKey : public flIKey
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_FLIKEY

  flKey();

private:
  ~flKey();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(flKey, flIKey)

flKey::flKey()
{
  /* member initializers and constructor code */
}

flKey::~flKey()
{
  /* destructor code */
}

/* AString key (); */
NS_IMETHODIMP flKey::Key(nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString sign (in AString args); */
NS_IMETHODIMP flKey::Sign(const nsAString & args, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_flIKey_h__ */
