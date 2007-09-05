/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM gm.idl
 */

#ifndef __gen_gm_h__
#define __gen_gm_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    IGM */
#define IGM_IID_STR "0e0d0b74-2c06-11dc-8314-0800200c9a66"

#define IGM_IID \
  {0x0e0d0b74, 0x2c06, 0x11dc, \
    { 0x83, 0x14, 0x08, 0x00, 0x20, 0x0c, 0x9a, 0x66 }}

class NS_NO_VTABLE IGM : public nsISupports {
 public: 

  NS_DEFINE_STATIC_IID_ACCESSOR(IGM_IID)

  /* attribute AString name; */
  NS_IMETHOD GetName(nsAString & aName) = 0;
  NS_IMETHOD SetName(const nsAString & aName) = 0;

  /* long add (in long a, in long b); */
  NS_IMETHOD Add(PRInt32 a, PRInt32 b, PRInt32 *_retval) = 0;

  /* AString thumb (in long square, in AString path); */
  NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

  /* AString rotate (in long degrees, in AString path); */
  NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) = 0;

  /* AString resize (in long square, in AString path); */
  NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) = 0;

};

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_IGM \
  NS_IMETHOD GetName(nsAString & aName); \
  NS_IMETHOD SetName(const nsAString & aName); \
  NS_IMETHOD Add(PRInt32 a, PRInt32 b, PRInt32 *_retval); \
  NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval); \
  NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval); \
  NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_IGM(_to) \
  NS_IMETHOD GetName(nsAString & aName) { return _to GetName(aName); } \
  NS_IMETHOD SetName(const nsAString & aName) { return _to SetName(aName); } \
  NS_IMETHOD Add(PRInt32 a, PRInt32 b, PRInt32 *_retval) { return _to Add(a, b, _retval); } \
  NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Thumb(square, path, _retval); } \
  NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) { return _to Rotate(degrees, path, _retval); } \
  NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) { return _to Resize(square, path, _retval); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_IGM(_to) \
  NS_IMETHOD GetName(nsAString & aName) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetName(aName); } \
  NS_IMETHOD SetName(const nsAString & aName) { return !_to ? NS_ERROR_NULL_POINTER : _to->SetName(aName); } \
  NS_IMETHOD Add(PRInt32 a, PRInt32 b, PRInt32 *_retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Add(a, b, _retval); } \
  NS_IMETHOD Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Thumb(square, path, _retval); } \
  NS_IMETHOD Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Rotate(degrees, path, _retval); } \
  NS_IMETHOD Resize(PRInt32 square, const nsAString & path, nsAString & _retval) { return !_to ? NS_ERROR_NULL_POINTER : _to->Resize(square, path, _retval); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class _MYCLASS_ : public IGM
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_IGM

  _MYCLASS_();

private:
  ~_MYCLASS_();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(_MYCLASS_, IGM)

_MYCLASS_::_MYCLASS_()
{
  /* member initializers and constructor code */
}

_MYCLASS_::~_MYCLASS_()
{
  /* destructor code */
}

/* attribute AString name; */
NS_IMETHODIMP _MYCLASS_::GetName(nsAString & aName)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}
NS_IMETHODIMP _MYCLASS_::SetName(const nsAString & aName)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* long add (in long a, in long b); */
NS_IMETHODIMP _MYCLASS_::Add(PRInt32 a, PRInt32 b, PRInt32 *_retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString thumb (in long square, in AString path); */
NS_IMETHODIMP _MYCLASS_::Thumb(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString rotate (in long degrees, in AString path); */
NS_IMETHODIMP _MYCLASS_::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* AString resize (in long square, in AString path); */
NS_IMETHODIMP _MYCLASS_::Resize(PRInt32 square, const nsAString & path, nsAString & _retval)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_gm_h__ */
