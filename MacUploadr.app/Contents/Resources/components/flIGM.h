/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM flIGM.idl
 */

#ifndef __gen_flIGM_h__
#define __gen_flIGM_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    flIGM */
#define FLIGM_IID_STR "0e0d0b74-2c06-11dc-8314-0800200c9a66"

#define FLIGM_IID \
  {0x0e0d0b74, 0x2c06, 0x11dc, \
    { 0x83, 0x14, 0x08, 0x00, 0x20, 0x0c, 0x9a, 0x66 }}

class NS_NO_VTABLE NS_SCRIPTABLE flIGM : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(FLIGM_IID)

  /* void init (in AString pwd); */
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd) = 0;

  /* AString thumb (in long square, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

  /* AString rotate (in long degrees, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) = 0;

  /* AString resize (in long square, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

  /* AString keyframe (in long square, in AString path); */
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(flIGM, FLIGM_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_FLIGM \
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd); \
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval); \
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval); \
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval); \
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_FLIGM(_to) \
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd) { return _to Init(pwd); } \
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Thumb(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) { return _to Rotate(degrees, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Resize(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Keyframe(square, path, _retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_FLIGM(_to) \
  NS_SCRIPTABLE NS_IMETHOD Init(const nsAString & pwd) { return !_to ? NS_ERROR_NULL_POINTER : _to->Init(pwd); } \
  NS_SCRIPTABLE NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Thumb(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Rotate(degrees, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Resize(square, path, _retval); } \
  NS_SCRIPTABLE NS_IMETHOD Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Keyframe(square, path, _retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class flGM : public flIGM
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_FLIGM

  flGM();

private:
  ~flGM();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(flGM, flIGM)

flGM::flGM()
{
  /* member initializers and constructor code */
}

flGM::~flGM()
{
  /* destructor code */
}

/* void init (in AString pwd); */
NS_IMETHODIMP flGM::Init(const nsAString & pwd)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString thumb (in long square, in AString path); */
NS_IMETHODIMP flGM::Thumb(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString rotate (in long degrees, in AString path); */
NS_IMETHODIMP flGM::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString resize (in long square, in AString path); */
NS_IMETHODIMP flGM::Resize(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString keyframe (in long square, in AString path); */
NS_IMETHODIMP flGM::Keyframe(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_flIGM_h__ */
